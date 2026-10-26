/**
 * Finds a cited chunk in the text of a PDF page.
 *
 * pdf.js splits a page into many short text items (roughly one per line or
 * run), and the stored chunk text differs from them in whitespace, line-break
 * hyphenation and leftover Markdown. Both sides are therefore compared as
 * letters and digits only. Each kept page character remembers the text item
 * and position it came from, so a match maps back to exact character ranges
 * per item.
 */

/** Character range `[start, end)` inside one text item. */
export type ItemRange = [start: number, end: number];

/** Item index → highlighted range in that item's string. */
export type PageHighlights = Map<number, ItemRange>;

/** Shortest start or end of a chunk that still counts as a reliable anchor. */
const MIN_ANCHOR = 24;

const isWordChar = (char: string) => /[\p{L}\p{N}]/u.test(char);

export function normalizeForMatch(text: string): string {
  let result = '';
  for (const char of text.normalize('NFC')) {
    if (isWordChar(char)) result += char.toLowerCase();
  }
  return result;
}

type IndexedPage = {
  text: string;
  origin: { item: number; offset: number }[];
};

function indexPage(items: string[]): IndexedPage {
  let text = '';
  const origin: IndexedPage['origin'] = [];
  items.forEach((item, itemIndex) => {
    // Iterate by code unit offset so ranges line up with `str.slice`.
    for (let offset = 0; offset < item.length; offset += 1) {
      const char = item[offset];
      if (!isWordChar(char)) continue;
      text += char.toLowerCase();
      origin.push({ item: itemIndex, offset });
    }
  });
  return { text, origin };
}

/** Length of the longest prefix of `needle` found in `haystack`, and where. */
function longestPrefix(haystack: string, needle: string) {
  let low = 0;
  let high = needle.length;
  let at = -1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const index = haystack.indexOf(needle.slice(0, middle));
    if (index === -1) {
      high = middle - 1;
    } else {
      low = middle;
      at = index;
    }
  }
  return { length: low, at };
}

/** Length of the longest suffix of `needle` found in `haystack`, and where it ends. */
function longestSuffix(haystack: string, needle: string) {
  let low = 0;
  let high = needle.length;
  let end = -1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const suffix = needle.slice(needle.length - middle);
    const index = haystack.lastIndexOf(suffix);
    if (index === -1) {
      high = middle - 1;
    } else {
      low = middle;
      end = index + suffix.length;
    }
  }
  return { length: low, end };
}

/**
 * Where the chunk sits in this page's normalized text, or null. `first` and
 * `last` say whether the chunk may start or end on this page; a chunk that
 * runs on to the next page is highlighted to the end of this one.
 */
function locate(
  page: string,
  chunk: string,
  { first, last }: { first: boolean; last: boolean },
): [number, number] | null {
  if (!chunk || !page) return null;
  const exact = page.indexOf(chunk);
  if (exact !== -1) return [exact, exact + chunk.length];

  const minimum = Math.min(MIN_ANCHOR, chunk.length);
  const prefix = longestPrefix(page, chunk);
  const suffix = longestSuffix(page, chunk);
  const hasStart = prefix.length >= minimum && prefix.at !== -1;
  const hasEnd = suffix.length >= minimum && suffix.end !== -1;

  if (hasStart && hasEnd && suffix.end > prefix.at) {
    // Extraction noise in the middle; anchor on both ends, but not across a
    // span far longer than the chunk itself.
    if (suffix.end - prefix.at <= chunk.length * 1.5 + 200) {
      return [prefix.at, suffix.end];
    }
  }
  if (hasStart && first) {
    return [
      prefix.at,
      last ? Math.min(page.length, prefix.at + chunk.length) : page.length,
    ];
  }
  if (hasEnd && last) {
    return [first ? Math.max(0, suffix.end - chunk.length) : 0, suffix.end];
  }
  // A middle page of a chunk spanning three or more pages.
  if (!first && !last && page.length <= chunk.length) {
    return chunk.includes(page.slice(0, minimum)) ? [0, page.length] : null;
  }
  return null;
}

/**
 * Highlighted ranges per text item for one page.
 *
 * `position` tells where this page sits among the chunk's pages: a chunk that
 * spans pages 3–4 starts on 3 and ends on 4. Without page information, pass
 * `{ first: true, last: true }`.
 */
export function findChunkHighlights(
  items: string[],
  chunkText: string,
  position: { first: boolean; last: boolean } = { first: true, last: true },
): PageHighlights {
  const highlights: PageHighlights = new Map();
  const page = indexPage(items);
  const match = locate(page.text, normalizeForMatch(chunkText), position);
  if (!match) return highlights;

  for (let index = match[0]; index < match[1]; index += 1) {
    const { item, offset } = page.origin[index];
    const range = highlights.get(item);
    highlights.set(
      item,
      range
        ? [Math.min(range[0], offset), Math.max(range[1], offset + 1)]
        : [offset, offset + 1],
    );
  }
  return highlights;
}
