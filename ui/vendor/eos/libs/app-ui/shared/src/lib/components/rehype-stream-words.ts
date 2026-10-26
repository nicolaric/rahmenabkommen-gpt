/**
 * Rehype step for the part of an answer that is still streaming: words that
 * arrived within the last fade duration are wrapped in
 * `<span class="stream-word">` so they fade in.
 *
 * It does not rely on React keeping DOM nodes: the conversation re-renders
 * (and may remount) the streaming paragraph on every token. Instead each word
 * is placed by its age: a word older than the fade renders as plain text and
 * never animates again; a younger word gets a negative `animation-delay` equal
 * to its age, so a remount continues its fade instead of restarting it.
 * Finished segments don't use this step at all.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  position?: { start?: { offset?: number } };
};

export const STREAM_WORD_CLASS = 'stream-word';
/** Matches the animation duration in streaming-words.css. */
export const STREAM_WORD_FADE_MS = 450;
/**
 * Words start one after another in reading order, at least this far apart,
 * even when several arrive in the same frame.
 */
export const STREAM_WORD_STAGGER_MS = 30;
/** No word waits longer than this after it arrived before it starts fading. */
export const STREAM_WORD_MAX_WAIT_MS = 120;

/** The previous word's start, as an age (ms ago); null before the first word. */
type Sequence = { previousStart: number | null };

export type StreamWordsOptions = {
  /**
   * Milliseconds since the character at this offset of the parsed text first
   * appeared. Without it every word counts as new.
   */
  ageAt?: (offset: number) => number;
};

// Code, math and graphics are shown as they are; splitting them would break
// their layout.
const SKIPPED_TAGS = new Set(['code', 'pre', 'math', 'svg', 'script', 'style']);

function isSkipped(node: HastNode): boolean {
  if (node.tagName && SKIPPED_TAGS.has(node.tagName)) return true;
  const className = node.properties?.['className'];
  const classes = Array.isArray(className) ? className : [className];
  return classes.some(
    (name) => typeof name === 'string' && name.startsWith('katex'),
  );
}

// Citation markers contain a space but must stay one plain string for the
// citation renderer, including one that is still streaming in at the end.
const CITATION_MARKER = /(\[(?:Doc|Brain) \d+\]|\[[A-Za-z]*(?: \d*)?$)/i;

function splitText(
  value: string,
  start: number | undefined,
  ageAt: StreamWordsOptions['ageAt'],
  sequence: Sequence,
): HastNode[] {
  const nodes: HastNode[] = [];
  let plain = '';
  const flushPlain = () => {
    if (plain) nodes.push({ type: 'text', value: plain });
    plain = '';
  };

  let index = 0;
  for (const chunk of value.split(CITATION_MARKER)) {
    if (!chunk) continue;
    const parts = CITATION_MARKER.test(chunk) ? [chunk] : chunk.split(/(\s+)/);
    for (const part of parts) {
      const offset = index;
      index += part.length;
      if (!part) continue;
      const isWord = !/^\s+$/.test(part) && !CITATION_MARKER.test(part);
      // Without a known position the word's age is unknown; showing it plain
      // is safer than replaying a fade.
      const revealedAge =
        !isWord || (ageAt && start === undefined)
          ? Infinity
          : ageAt
            ? ageAt(start! + offset)
            : 0;
      // Each word starts at least one stagger after the word before it, so
      // words appear in reading order even when several arrive at once or a
      // new frame lands while earlier words are still waiting; no word waits
      // longer than the cap. Ages shift uniformly between renders, so a
      // word's start stays the same however often the paragraph re-renders.
      let age = revealedAge;
      if (Number.isFinite(revealedAge)) {
        if (sequence.previousStart !== null) {
          age = Math.max(
            revealedAge - STREAM_WORD_MAX_WAIT_MS,
            Math.min(
              revealedAge,
              sequence.previousStart - STREAM_WORD_STAGGER_MS,
            ),
          );
        }
        sequence.previousStart = age;
      }
      if (age >= STREAM_WORD_FADE_MS) {
        plain += part;
        continue;
      }
      flushPlain();
      nodes.push({
        type: 'element',
        tagName: 'span',
        properties: {
          className: [STREAM_WORD_CLASS],
          // Negative: resume a fade already under way; positive: wait for
          // the words before it in the same batch.
          style: `animation-delay: ${Math.round(-age)}ms`,
        },
        children: [{ type: 'text', value: part }],
      });
    }
  }
  flushPlain();
  return nodes;
}

function wrapWords(
  node: HastNode,
  ageAt: StreamWordsOptions['ageAt'],
  sequence: Sequence,
): void {
  if (!node.children || isSkipped(node)) return;
  node.children = node.children.flatMap((child) => {
    if (child.type === 'text' && child.value) {
      return splitText(
        child.value,
        child.position?.start?.offset,
        ageAt,
        sequence,
      );
    }
    wrapWords(child, ageAt, sequence);
    return [child];
  });
}

export function rehypeStreamWords(options: StreamWordsOptions = {}) {
  return (tree: HastNode) =>
    wrapWords(tree, options.ageAt, { previousStart: null });
}
