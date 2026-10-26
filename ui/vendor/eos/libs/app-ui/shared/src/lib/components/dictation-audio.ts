/* Audio helpers for live dictation: the microphone is cut into phrases at
   pauses, and each phrase is transcribed while the user keeps talking. */

/** Whisper works at 16 kHz; sending more only costs upload time. */
export const DICTATION_SAMPLE_RATE = 16000;

/** Average the input down to `outRate`, which must not exceed `inRate`. */
export function downsample(
  input: Float32Array,
  inRate: number,
  outRate = DICTATION_SAMPLE_RATE,
): Float32Array {
  if (inRate === outRate) return input.slice();
  const ratio = inRate / outRate;
  const output = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < output.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    output[i] = end > start ? sum / (end - start) : 0;
  }
  return output;
}

export function toPcm16(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm;
}

/** A mono 16-bit WAV file, which every transcription provider accepts. */
export function encodeWav(
  chunks: Int16Array[],
  sampleRate = DICTATION_SAMPLE_RATE,
): Blob {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const header = new DataView(new ArrayBuffer(44));
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      header.setUint8(offset + i, text.charCodeAt(i));
    }
  };
  writeText(0, 'RIFF');
  header.setUint32(4, 36 + length * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true); // PCM
  header.setUint16(22, 1, true); // mono
  header.setUint32(24, sampleRate, true);
  header.setUint32(28, sampleRate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  writeText(36, 'data');
  header.setUint32(40, length * 2, true);
  return new Blob([header.buffer, ...chunks.map((chunk) => chunk.slice())], {
    type: 'audio/wav',
  });
}

function rms(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return frame.length ? Math.sqrt(sum / frame.length) : 0;
}

export interface PhraseSegmenterOptions {
  sampleRate?: number;
  /** Silence that ends a phrase. */
  pauseMs?: number;
  /** Past this length a phrase also ends at a shorter pause, such as a
      comma, so a long sentence still appears piece by piece. */
  longPhraseMs?: number;
  shortPauseMs?: number;
  /** Speech shorter than this is treated as a noise, not a phrase. */
  minSpeechMs?: number;
  /** A phrase is cut here even without a pause, to keep text flowing. */
  maxPhraseMs?: number;
  /** Audio kept from before speech starts, so first syllables survive. */
  prerollMs?: number;
  /** The quietest level counted as speech, whatever the room noise. */
  minSpeechLevel?: number;
  /** How far back the room's noise level is judged from. */
  noiseWindowMs?: number;
}

/**
 * Splits a microphone stream into phrases at pauses.
 *
 * Speech is a frame louder than both a floor and three times the room's
 * noise level. The noise level is the quietest tenth of the last few
 * seconds: speech has short gaps between syllables that reach it, while a
 * steady sound such as a workshop machine sets it and so is not taken for
 * speech. It needs no quiet moment to calibrate and follows a room that gets
 * louder.
 */
export class PhraseSegmenter {
  private readonly sampleRate: number;
  private readonly pauseMs: number;
  private readonly longPhraseMs: number;
  private readonly shortPauseMs: number;
  private readonly minSpeechMs: number;
  private readonly maxPhraseMs: number;
  private readonly prerollMs: number;
  private readonly minSpeechLevel: number;
  private readonly noiseWindowMs: number;

  private recentLevels: number[] = [];
  private preroll: Float32Array[] = [];
  private prerollLength = 0;
  private phrase: Float32Array[] | null = null;
  private phraseLength = 0;
  private speechMs = 0;
  private silenceMs = 0;
  private phrasesHeard = 0;

  /** Audio listened to so far. */
  listenedMs = 0;
  /** Time since the last speech frame (or since listening began). */
  msSinceSpeech = 0;

  /** Whether the user has said anything yet, beyond a click or a cough. */
  get heardSpeech(): boolean {
    return this.phrasesHeard > 0 || this.speechMs >= this.minSpeechMs;
  }

  constructor(options: PhraseSegmenterOptions = {}) {
    this.sampleRate = options.sampleRate ?? DICTATION_SAMPLE_RATE;
    this.pauseMs = options.pauseMs ?? 700;
    this.longPhraseMs = options.longPhraseMs ?? 6000;
    this.shortPauseMs = options.shortPauseMs ?? 300;
    this.minSpeechMs = options.minSpeechMs ?? 250;
    this.maxPhraseMs = options.maxPhraseMs ?? 20000;
    this.prerollMs = options.prerollMs ?? 300;
    this.minSpeechLevel = options.minSpeechLevel ?? 0.01;
    this.noiseWindowMs = options.noiseWindowMs ?? 3000;
  }

  /** Feed one frame; returns the phrases it completed. */
  push(frame: Float32Array): Float32Array[] {
    const frameMs = (frame.length / this.sampleRate) * 1000;
    const level = rms(frame);
    const threshold = Math.max(
      this.minSpeechLevel,
      this.noiseLevel(level, frameMs) * 3,
    );
    const isSpeech = level > threshold;
    this.listenedMs += frameMs;
    this.msSinceSpeech = isSpeech ? 0 : this.msSinceSpeech + frameMs;
    const done: Float32Array[] = [];

    if (!this.phrase) {
      if (isSpeech) {
        this.phrase = [...this.preroll, frame];
        this.phraseLength = this.prerollLength + frame.length;
        this.preroll = [];
        this.prerollLength = 0;
        this.speechMs = frameMs;
        this.silenceMs = 0;
      } else {
        this.keepPreroll(frame);
      }
      return done;
    }

    this.phrase.push(frame);
    this.phraseLength += frame.length;
    if (isSpeech) {
      this.speechMs += frameMs;
      this.silenceMs = 0;
    } else {
      this.silenceMs += frameMs;
    }

    const phraseMs = (this.phraseLength / this.sampleRate) * 1000;
    const pauseMs =
      phraseMs >= this.longPhraseMs ? this.shortPauseMs : this.pauseMs;
    if (this.silenceMs >= pauseMs || phraseMs >= this.maxPhraseMs) {
      const phrase = this.endPhrase();
      if (phrase) done.push(phrase);
    }
    return done;
  }

  /** The phrase in progress, if it holds enough speech to transcribe. */
  flush(): Float32Array | null {
    return this.phrase ? this.endPhrase() : null;
  }

  private endPhrase(): Float32Array | null {
    const frames = this.phrase ?? [];
    const enoughSpeech = this.speechMs >= this.minSpeechMs;
    this.phrase = null;
    this.phraseLength = 0;
    this.speechMs = 0;
    this.silenceMs = 0;
    if (!enoughSpeech) return null;
    this.phrasesHeard += 1;

    const joined = new Float32Array(
      frames.reduce((total, frame) => total + frame.length, 0),
    );
    let offset = 0;
    for (const frame of frames) {
      joined.set(frame, offset);
      offset += frame.length;
    }
    return joined;
  }

  /** The noise level, judged from the recent frames including this one. */
  private noiseLevel(level: number, frameMs: number): number {
    this.recentLevels.push(level);
    const maxFrames = Math.max(1, Math.round(this.noiseWindowMs / frameMs));
    if (this.recentLevels.length > maxFrames) this.recentLevels.shift();
    const sorted = [...this.recentLevels].sort((a, b) => a - b);
    return sorted[Math.floor((sorted.length - 1) * 0.1)];
  }

  private keepPreroll(frame: Float32Array) {
    this.preroll.push(frame);
    this.prerollLength += frame.length;
    const maxLength = (this.prerollMs / 1000) * this.sampleRate;
    while (
      this.preroll.length > 1 &&
      this.prerollLength - this.preroll[0].length >= maxLength
    ) {
      this.prerollLength -= this.preroll.shift()?.length ?? 0;
    }
  }
}
