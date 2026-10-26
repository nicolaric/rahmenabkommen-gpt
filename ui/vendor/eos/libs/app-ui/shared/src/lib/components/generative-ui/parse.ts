import { chartFallbackMarkdown } from './chart-data';
import { checklistToMarkdown, parseChecklist } from './checklist-data';

/**
 * Tolerant parser for the layout tags an assistant may mix into Markdown.
 *
 * Only whitelisted tag names are ever treated as markup. A UI block must start
 * with one of them at the beginning of a line (outside code fences) and runs to
 * its matching close tag, or to the end of the input while it is still
 * streaming. Everything else is Markdown and is left untouched.
 */

export const UI_TAGS = [
  'box',
  'row',
  'text',
  'icon',
  'divider',
  'badge',
  'grid',
  'stat',
  'chart',
  'email',
  'checklist',
  'resource',
] as const;

export type UiTag = (typeof UI_TAGS)[number];

/** Tags that never have children, with or without a trailing `/>`. */
const VOID_TAGS: ReadonlySet<string> = new Set(['icon', 'divider', 'stat']);
const UI_TAG_SET: ReadonlySet<string> = new Set(UI_TAGS);
// Content of these tags is data (chart JSON, an email body, task or detail
// lines), kept verbatim and never scanned for tags.
const RAW_TAGS: ReadonlySet<string> = new Set([
  'chart',
  'email',
  'checklist',
  'resource',
]);

/** Where the close tag of a raw element starts and ends, if it has arrived. */
function findRawClose(
  source: string,
  name: string,
  from: number,
): { start: number; end: number } | null {
  const pattern = new RegExp(`</${name}\\s*>`, 'gi');
  pattern.lastIndex = from;
  const match = pattern.exec(source);
  return match ? { start: match.index, end: pattern.lastIndex } : null;
}

export type UiPropValue = string | number | boolean;

export type UiElementNode = {
  type: 'element';
  tag: UiTag;
  props: Record<string, UiPropValue>;
  children: UiNode[];
  /** Set on a raw element raw element whose close tag has not streamed in yet. */
  open?: boolean;
};

export type UiTextNode = { type: 'text'; text: string };

export type UiNode = UiElementNode | UiTextNode;

export type ContentSegment =
  | { type: 'markdown'; text: string }
  | { type: 'ui'; source: string; closed: boolean };

const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
const BLOCK_START_PATTERN = new RegExp(`^<(${UI_TAGS.join('|')})(?=[\\s/>]|$)`);
// Any tag-shaped token, whitelisted or not. Unknown ones are dropped while
// their text content is kept; a lone `<` (as in `a < b`) never matches.
const TAG_TOKEN_PATTERN = /<(\/?)([A-Za-z][\w-]*)((?:\s+[^<>]*?)?)\s*(\/?)>/y;
// A tag that has started but whose `>` has not streamed in yet.
const PARTIAL_TAG_PATTERN = /<\/?[A-Za-z][^<>]*$|<\/?$/;
const ATTRIBUTE_PATTERN =
  /([A-Za-z][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*([^}]*?)\s*\}))?/g;

/** Whether `content` contains at least one line-start UI block. */
export function hasUiBlocks(content: string): boolean {
  return splitUiBlocks(content).some((segment) => segment.type === 'ui');
}

/**
 * Cuts content into Markdown regions and UI blocks, in order. Content without
 * UI blocks comes back as a single Markdown segment, unchanged.
 */
export function splitUiBlocks(source: string): ContentSegment[] {
  if (!source || !source.includes('<')) {
    return [{ type: 'markdown', text: source }];
  }

  const segments: ContentSegment[] = [];
  let markdownStart = 0;
  let offset = 0;
  let fence: string | null = null;

  while (offset < source.length) {
    const lineEnd = source.indexOf('\n', offset);
    const nextLine = lineEnd === -1 ? source.length : lineEnd + 1;
    const line = source.slice(offset, nextLine);
    const fenceMatch = line.match(FENCE_PATTERN);

    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length
      ) {
        fence = null;
      }
      offset = nextLine;
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      offset = nextLine;
      continue;
    }

    if (BLOCK_START_PATTERN.test(line)) {
      const end = findBlockEnd(source, offset);
      if (offset > markdownStart) {
        segments.push({
          type: 'markdown',
          text: source.slice(markdownStart, offset),
        });
      }
      segments.push({
        type: 'ui',
        source: source.slice(offset, end ?? source.length),
        closed: end !== null,
      });
      if (end === null) return segments;
      offset = end;
      markdownStart = end;
      continue;
    }

    offset = nextLine;
  }

  if (markdownStart < source.length || segments.length === 0) {
    segments.push({ type: 'markdown', text: source.slice(markdownStart) });
  }
  return segments;
}

/**
 * Offset just past the close tag that balances the block starting at `start`,
 * or null while the block is still open. Only whitelisted tags count towards
 * the depth; mismatched close tags are ignored.
 */
function findBlockEnd(source: string, start: number): number | null {
  const stack: string[] = [];
  let index = start;
  while (index < source.length) {
    const next = source.indexOf('<', index);
    if (next === -1) return null;
    TAG_TOKEN_PATTERN.lastIndex = next;
    const match = TAG_TOKEN_PATTERN.exec(source);
    if (!match) {
      index = next + 1;
      continue;
    }
    index = TAG_TOKEN_PATTERN.lastIndex;
    const [, closing, rawName, , selfClosing] = match;
    const name = rawName.toLowerCase();
    if (!UI_TAG_SET.has(name)) continue;

    if (closing) {
      const at = stack.lastIndexOf(name);
      if (at === -1) continue;
      stack.length = at;
    } else if (!selfClosing && RAW_TAGS.has(name)) {
      const close = findRawClose(source, name, index);
      if (!close) return null;
      index = close.end;
    } else if (!selfClosing && !VOID_TAGS.has(name)) {
      stack.push(name);
    }
    if (stack.length === 0) return index;
  }
  return null;
}

function parseProps(raw: string): Record<string, UiPropValue> {
  const props: Record<string, UiPropValue> = {};
  for (const match of raw.matchAll(ATTRIBUTE_PATTERN)) {
    const [, key, doubleQuoted, singleQuoted, braced] = match;
    if (doubleQuoted !== undefined || singleQuoted !== undefined) {
      props[key] = doubleQuoted ?? singleQuoted ?? '';
    } else if (braced !== undefined) {
      if (braced === 'true' || braced === 'false') {
        props[key] = braced === 'true';
      } else if (/^-?\d+(?:\.\d+)?$/.test(braced)) {
        props[key] = Number(braced);
      }
      // Anything else in braces is an expression; expressions are never
      // evaluated, so the prop is dropped.
    } else {
      props[key] = true;
    }
  }
  return props;
}

/**
 * Parses one UI block into a node tree. Open elements are closed at the end of
 * the input, and a trailing tag that has not finished streaming is dropped.
 */
export function parseUiBlock(source: string): UiNode[] {
  const input = source.replace(PARTIAL_TAG_PATTERN, '');
  const root: UiElementNode = {
    type: 'element',
    tag: 'box',
    props: {},
    children: [],
  };
  const stack: UiElementNode[] = [root];
  let textStart = 0;
  let index = 0;

  const flushText = (end: number) => {
    const text = input.slice(textStart, end);
    if (text.trim()) {
      stack[stack.length - 1].children.push({
        type: 'text',
        text: text.trim(),
      });
    }
  };

  while (index < input.length) {
    const next = input.indexOf('<', index);
    if (next === -1) break;
    TAG_TOKEN_PATTERN.lastIndex = next;
    const match = TAG_TOKEN_PATTERN.exec(input);
    if (!match) {
      index = next + 1;
      continue;
    }

    flushText(next);
    index = TAG_TOKEN_PATTERN.lastIndex;
    textStart = index;

    const [, closing, rawName, rawProps, selfClosing] = match;
    const name = rawName.toLowerCase();
    if (!UI_TAG_SET.has(name)) continue;

    if (closing) {
      for (let at = stack.length - 1; at > 0; at -= 1) {
        if (stack[at].tag === name) {
          stack.length = at;
          break;
        }
      }
      continue;
    }

    const element: UiElementNode = {
      type: 'element',
      tag: name as UiTag,
      props: parseProps(rawProps),
      children: [],
    };
    stack[stack.length - 1].children.push(element);
    if (!selfClosing && RAW_TAGS.has(name)) {
      const close = findRawClose(input, name, index);
      const raw = input.slice(index, close ? close.start : input.length);
      if (raw.trim()) element.children.push({ type: 'text', text: raw.trim() });
      if (!close) element.open = true;
      index = close ? close.end : input.length;
      textStart = index;
    } else if (!selfClosing && !VOID_TAGS.has(name)) {
      stack.push(element);
    }
  }

  flushText(input.length);
  return root.children;
}

/** The text of a node tree, in reading order, joined by spaces. */
export function nodeText(nodes: UiNode[]): string {
  return nodes
    .map((node) => (node.type === 'text' ? node.text : nodeText(node.children)))
    .filter(Boolean)
    .join(' ');
}

/**
 * Like `nodeText`, but a single-line semibold `<text>` keeps its weight as
 * Markdown bold, so titles stay recognisable without the layout.
 */
function nodeMarkdown(nodes: UiNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.text;
      const text = nodeMarkdown(node.children);
      const bold =
        node.tag === 'text' &&
        node.props.weight === 'semibold' &&
        text &&
        !text.includes('\n') &&
        !text.includes('**');
      return bold ? `**${text}**` : text;
    })
    .filter(Boolean)
    .join(' ');
}

function nodeToFallback(node: UiNode): string[] {
  if (node.type === 'text') return [node.text];
  switch (node.tag) {
    case 'icon':
      return [];
    case 'divider':
      return ['---'];
    case 'chart':
      return [chartFallbackMarkdown(node.props, nodeText(node.children))];
    case 'checklist': {
      const { title } = node.props;
      return [
        checklistToMarkdown(
          title === undefined || title === '' ? null : String(title),
          parseChecklist(nodeText(node.children)),
        ),
      ];
    }
    case 'resource': {
      const { title, href, action } = node.props;
      const lines = nodeText(node.children)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const link =
        typeof href === 'string' && href
          ? `[${action === undefined || action === '' ? href : action}](${href})`
          : null;
      return [
        [title === undefined || title === '' ? null : `**${title}**`, ...lines]
          .filter(Boolean)
          .join('\n'),
        ...(link ? [link] : []),
      ].filter(Boolean);
    }
    case 'email': {
      const { subject } = node.props;
      const body = nodeText(node.children);
      return subject === undefined || subject === ''
        ? [body]
        : [`**${subject}**`, body];
    }
    case 'stat': {
      const { label, value, hint } = node.props;
      if (value === undefined || value === '') {
        return label === undefined ? [] : [String(label)];
      }
      const line = `${label === undefined ? '' : `**${label}:** `}${value}`;
      return [hint === undefined ? line : `${line} (${hint})`];
    }
    case 'row':
    case 'text':
    case 'badge': {
      const text = nodeMarkdown([node]);
      return text ? [text] : [];
    }
    case 'box':
    case 'grid':
      return node.children.flatMap(nodeToFallback);
  }
}

/**
 * Markdown-only version of a message: tags are removed, their text is kept as
 * paragraphs, and dividers become horizontal rules.
 */
export function toFallbackMarkdown(content: string): string {
  const segments = splitUiBlocks(content);
  if (segments.every((segment) => segment.type === 'markdown')) {
    return content;
  }
  return segments
    .map((segment) =>
      segment.type === 'markdown'
        ? segment.text
        : `\n${parseUiBlock(segment.source).flatMap(nodeToFallback).join('\n\n')}\n\n`,
    )
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
