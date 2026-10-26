import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DICTATION_SAMPLE_RATE,
  PhraseSegmenter,
  downsample,
  encodeWav,
  toPcm16,
} from './dictation-audio';

export type DictationState = 'idle' | 'recording' | 'transcribing';

export type DictationError = 'permission' | 'unsupported' | 'transcription';

export interface DictationTranscribeOptions {
  /** The text before this recording, so phrases read as one text. */
  prompt?: string;
}

export type DictationTranscriber = (
  recording: Blob,
  options?: DictationTranscribeOptions,
) => Promise<string>;

/* A dictated message is a few sentences; this cap only stops a forgotten
   recording from growing past what the server accepts (16 kHz WAV is about
   2 MB a minute). */
export const MAX_DICTATION_MS = 10 * 60 * 1000;

/* About 40 ms at 48 kHz: short enough to notice a pause quickly. */
const FRAME_SIZE = 2048;

/* Whisper reads only the end of a prompt. */
const PROMPT_CHARS = 500;

type AudioContextClass = typeof AudioContext;

const audioContextClass = (): AudioContextClass | undefined =>
  typeof window === 'undefined'
    ? undefined
    : (window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextClass })
        .webkitAudioContext);

export const isDictationSupported = () =>
  Boolean(audioContextClass()) &&
  typeof navigator !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia);

const joinPhrases = (phrases: string[]) =>
  phrases
    .map((phrase) => phrase.trim())
    .filter(Boolean)
    .join(' ');

interface Session {
  context: AudioContext;
  stream: MediaStream | null;
  processor: ScriptProcessorNode | null;
  segmenter: PhraseSegmenter;
  /** Everything recorded, for one retry of the whole dictation. */
  audio: Int16Array[];
  /** Transcribed phrases by position; undefined while pending. */
  phrases: (string | null | undefined)[];
  pending: Set<Promise<void>>;
  discarded: boolean;
}

interface UseDictationOptions {
  transcribe: DictationTranscriber;
  /** The dictated text so far, from '' when listening starts; `final` once
      the dictation has ended. */
  onText: (text: string, final: boolean) => void;
  onError: (error: DictationError) => void;
  /** End by itself after this much silence following speech. */
  endAfterSilenceMs?: number;
  /** End without text when nothing has been said for this long. */
  giveUpAfterMs?: number;
}

type StopReason = 'manual' | 'silence' | 'nothing';

/**
 * Live dictation: the microphone is cut into phrases at pauses and each one
 * is transcribed while the user keeps talking, so the text grows phrase by
 * phrase. It is returned for review, never sent on the user's behalf.
 */
export function useDictation({
  transcribe,
  onText,
  onError,
  endAfterSilenceMs,
  giveUpAfterMs,
}: UseDictationOptions) {
  const [state, setState] = useState<DictationState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pendingPhrases, setPendingPhrases] = useState(0);
  const sessionRef = useRef<Session | null>(null);
  const timerRef = useRef<number | null>(null);
  // Read when phrases finish, after the render that started the dictation.
  const callbacksRef = useRef({
    transcribe,
    onText,
    onError,
    endAfterSilenceMs,
    giveUpAfterMs,
  });
  callbacksRef.current = {
    transcribe,
    onText,
    onError,
    endAfterSilenceMs,
    giveUpAfterMs,
  };

  /* Phrases are shown in order: one still being transcribed holds back the
     ones after it. */
  const visibleText = (session: Session) => {
    const ready: string[] = [];
    for (const phrase of session.phrases) {
      if (phrase === undefined) break;
      if (phrase) ready.push(phrase);
    }
    return joinPhrases(ready);
  };

  const sendPhrase = useCallback((session: Session, samples: Float32Array) => {
    const index = session.phrases.length;
    session.phrases.push(undefined);
    const prompt = visibleText(session).slice(-PROMPT_CHARS) || undefined;
    const request = callbacksRef.current
      .transcribe(encodeWav([toPcm16(samples)]), { prompt })
      .then(
        (text) => {
          session.phrases[index] = text.trim();
        },
        () => {
          session.phrases[index] = null;
        },
      )
      .then(() => {
        session.pending.delete(request);
        if (session.discarded) return;
        setPendingPhrases(session.pending.size);
        callbacksRef.current.onText(visibleText(session), false);
      });
    session.pending.add(request);
    setPendingPhrases(session.pending.size);
  }, []);

  const releaseMicrophone = useCallback((session: Session) => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (session.processor) {
      session.processor.onaudioprocess = null;
      session.processor.disconnect();
    }
    session.stream?.getTracks().forEach((track) => track.stop());
    void session.context.close().catch(() => undefined);
  }, []);

  const stop = useCallback(
    async (reason: StopReason = 'manual') => {
      const session = sessionRef.current;
      if (!session) return;
      sessionRef.current = null;
      releaseMicrophone(session);

      const lastPhrase = session.segmenter.flush();
      if (lastPhrase) sendPhrase(session, lastPhrase);
      if (session.discarded) return;

      setState('transcribing');
      while (session.pending.size) {
        await Promise.all(session.pending);
      }
      if (session.discarded) return;

      const failed = session.phrases.some((phrase) => phrase === null);
      /* No phrase means the pause detection heard none, e.g. a quiet voice;
       a failed phrase would leave a gap. Either way the whole recording is
       sent once more as a single file. */
      const retryWhole =
        reason !== 'nothing' &&
        (failed || session.phrases.length === 0) &&
        session.audio.some((chunk) => chunk.length);
      let text = visibleText(session);
      if (retryWhole) {
        try {
          text = (
            await callbacksRef.current.transcribe(encodeWav(session.audio))
          ).trim();
        } catch {
          callbacksRef.current.onError('transcription');
        }
      }
      if (session.discarded) return;
      callbacksRef.current.onText(text, true);
      setPendingPhrases(0);
      setState('idle');
    },
    [releaseMicrophone, sendPhrase],
  );

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    const AudioContextCtor = audioContextClass();
    if (!AudioContextCtor || !navigator.mediaDevices?.getUserMedia) {
      callbacksRef.current.onError('unsupported');
      return;
    }

    /* Created before awaiting the microphone, while the tap still counts as
       a user gesture: iOS keeps an audio context started later suspended. */
    const session: Session = {
      context: new AudioContextCtor(),
      stream: null,
      processor: null,
      segmenter: new PhraseSegmenter(),
      audio: [],
      phrases: [],
      pending: new Set(),
      discarded: false,
    };
    sessionRef.current = session;

    try {
      session.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      sessionRef.current = null;
      void session.context.close().catch(() => undefined);
      callbacksRef.current.onError('permission');
      return;
    }
    if (session.discarded) {
      releaseMicrophone(session);
      return;
    }

    await session.context.resume?.().catch(() => undefined);
    const source = session.context.createMediaStreamSource(session.stream);
    /* ScriptProcessorNode is deprecated in favour of AudioWorklet, but it is
       supported everywhere and needs no separately served module. */
    const processor = session.context.createScriptProcessor(FRAME_SIZE, 1, 1);
    session.processor = processor;
    processor.onaudioprocess = (event) => {
      const frame = downsample(
        event.inputBuffer.getChannelData(0),
        session.context.sampleRate,
        DICTATION_SAMPLE_RATE,
      );
      session.audio.push(toPcm16(frame));
      for (const phrase of session.segmenter.push(frame)) {
        sendPhrase(session, phrase);
      }
      const { segmenter } = session;
      const { endAfterSilenceMs: endAfter, giveUpAfterMs: giveUp } =
        callbacksRef.current;
      if (
        endAfter &&
        segmenter.heardSpeech &&
        segmenter.msSinceSpeech >= endAfter
      ) {
        void stop('silence');
      } else if (
        giveUp &&
        !segmenter.heardSpeech &&
        segmenter.listenedMs >= giveUp
      ) {
        void stop('nothing');
      }
    };
    source.connect(processor);
    // Chrome only runs a processor whose output is connected; it is silent.
    processor.connect(session.context.destination);

    const startedAt = Date.now();
    setElapsedMs(0);
    setPendingPhrases(0);
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setElapsedMs(elapsed);
      if (elapsed >= MAX_DICTATION_MS) void stop();
    }, 250);
    setState('recording');
    callbacksRef.current.onText('', false);
  }, [releaseMicrophone, sendPhrase, stop]);

  /* Leaving the page mid-dictation must not keep the microphone open or
     write text the user never finished. */
  useEffect(
    () => () => {
      const session = sessionRef.current;
      if (!session) return;
      session.discarded = true;
      sessionRef.current = null;
      releaseMicrophone(session);
    },
    [releaseMicrophone],
  );

  return {
    state,
    elapsedMs,
    pendingPhrases,
    start,
    stop: () => void stop('manual'),
  };
}
