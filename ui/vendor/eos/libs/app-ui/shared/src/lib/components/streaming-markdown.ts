import { splitUiBlocks, UI_TAGS } from './generative-ui/parse';

const UNSAFE_DOCUMENT_PATTERNS = [
  /^\s*\[[^\]]+\]:\s+\S+/m,
  /^\s*\[\^[^\]]+\]:/m,
  /<\/?(?:address|article|aside|blockquote|div|table|pre|script|style)\b/i,
];

const UNSAFE_BLOCK_PATTERN = /^(?:\s*(?:[-+*]|\d+[.)])\s+|\s*>| {4,})/;
const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
const ATX_HEADING_PATTERN = /^ {0,3}#{1,6}(?:\s|$)/;

/**
 * Splits a growing Markdown document into completed blocks and one mutable
 * tail. Completed prefixes are append-only, allowing their rendered Markdown
 * trees to remain mounted while only the tail is reparsed during streaming.
 */
export function splitStreamingMarkdown(source: string): string[] {
  if (
    !source ||
    UNSAFE_DOCUMENT_PATTERNS.some((pattern) => pattern.test(source))
  ) {
    return [source];
  }

  const lines = source.match(/.*(?:\n|$)/g)?.filter(Boolean) ?? [];
  const segments: string[] = [];
  let start = 0;
  let offset = 0;
  let fence: string | null = null;
  let blockIsUnsafe = false;

  for (const line of lines) {
    const fenceMatch = line.match(FENCE_PATTERN);

    if (fence) {
      offset += line.length;
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length
      ) {
        segments.push(source.slice(start, offset));
        start = offset;
        fence = null;
        blockIsUnsafe = false;
      }
      continue;
    }

    if (fenceMatch) {
      fence = fenceMatch[1];
      offset += line.length;
      continue;
    }

    if (UNSAFE_BLOCK_PATTERN.test(line)) {
      blockIsUnsafe = true;
    }

    offset += line.length;

    // An ATX heading is a self-contained block once its line is complete.
    if (!blockIsUnsafe && ATX_HEADING_PATTERN.test(line)) {
      segments.push(source.slice(start, offset));
      start = offset;
      continue;
    }

    // A blank line safely terminates ordinary paragraphs and GFM tables.
    if (!blockIsUnsafe && line.trim() === '' && offset > start) {
      segments.push(source.slice(start, offset));
      start = offset;
    }
  }

  const tail = source.slice(start);
  if (tail || segments.length === 0) {
    segments.push(tail);
  }

  return segments;
}

/**
 * Hides inline markup the stream has opened but not yet closed, so the mutable
 * tail can be parsed as Markdown on every token without flashing raw
 * delimiters. `**bo` renders as `bo`, and completes into bold as soon as the
 * closing marker arrives.
 */
export function maskIncompleteInlineMarkup(tail: string): string {
  let masked = tail;

  // An unclosed code span would otherwise swallow the rest of the tail.
  const backticks = masked.match(/`/g)?.length ?? 0;
  if (backticks % 2 === 1) masked = masked.replace(/`([^`]*)$/, '$1');

  for (const marker of ['**', '__', '~~']) {
    const occurrences = masked.split(marker).length - 1;
    if (occurrences % 2 === 1) {
      const at = masked.lastIndexOf(marker);
      masked = masked.slice(0, at) + masked.slice(at + marker.length);
    }
  }

  // Single-character emphasis, counted only outside the doubles handled above.
  for (const marker of ['*', '_']) {
    const pattern = new RegExp(
      `(?<!\\${marker})\\${marker}(?!\\${marker})`,
      'g',
    );
    const occurrences = masked.match(pattern)?.length ?? 0;
    if (occurrences % 2 === 1) {
      const at = masked.search(
        new RegExp(
          `\\${marker}(?!\\${marker})(?![\\s\\S]*\\${marker}(?!\\${marker}))`,
        ),
      );
      if (at >= 0) masked = masked.slice(0, at) + masked.slice(at + 1);
    }
  }

  // A half-written link or image: keep the label, drop the syntax.
  masked = masked.replace(/!?\[([^\]]*)$/, '$1');
  masked = masked.replace(/!?\[([^\]]*)\]\([^)]*$/, '$1');

  return masked;
}

export type StreamingSegment =
  | { type: 'markdown'; text: string }
  | { type: 'ui'; source: string; closed: boolean };

// The last streamed line may be the start of a UI block whose tag name has
// not fully arrived (`<`, `<bo`). Holding it back avoids flashing it as text.
function isPartialUiTagLine(line: string): boolean {
  const match = line.match(/^<([a-z]*)$/);
  return Boolean(match && UI_TAGS.some((tag) => tag.startsWith(match[1])));
}

/**
 * Splits streamed content into UI blocks and Markdown segments. Markdown
 * between blocks goes through `splitStreamingMarkdown`, so content without UI
 * blocks is segmented exactly as before.
 */
export function splitStreamingContent(
  source: string,
  streaming = false,
): StreamingSegment[] {
  let content = source;
  if (streaming) {
    const lastLineStart = content.lastIndexOf('\n') + 1;
    if (isPartialUiTagLine(content.slice(lastLineStart))) {
      content = content.slice(0, lastLineStart);
    }
  }

  const blocks = splitUiBlocks(content);
  if (blocks.length === 1 && blocks[0].type === 'markdown') {
    return splitStreamingMarkdown(content).map((text) => ({
      type: 'markdown',
      text,
    }));
  }

  // Blank lines around a block render nothing; dropping them keeps the
  // segment list to the parts that actually show.
  return blocks.flatMap((segment): StreamingSegment[] =>
    segment.type === 'ui'
      ? [segment]
      : splitStreamingMarkdown(segment.text)
          .filter((text) => text.trim() !== '')
          .map((text) => ({ type: 'markdown', text })),
  );
}
