import { MessageSquareQuote, Quote, X } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';

/** Marks an answer's text; only selections inside one such element count. */
export const ANSWER_TEXT_ATTRIBUTE = 'data-answer-text';

const MAX_PASSAGE_CHARS = 1_000;

type SelectedPassage = { text: string; top: number; left: number };

function closestAnswer(node: Node | null): Element | null {
  const element = node instanceof Element ? node : node?.parentElement;
  return element?.closest(`[${ANSWER_TEXT_ATTRIBUTE}]`) ?? null;
}

function readSelectedPassage(): SelectedPassage | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }
  const answer = closestAnswer(selection.anchorNode);
  if (!answer || answer !== closestAnswer(selection.focusNode)) return null;

  const text = normalizePassage(selection.toString());
  if (!text) return null;
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  return {
    text:
      text.length > MAX_PASSAGE_CHARS
        ? `${text.slice(0, MAX_PASSAGE_CHARS).trimEnd()}…`
        : text,
    top: rect.top,
    left: rect.left + rect.width / 2,
  };
}

/**
 * Selected text without layout whitespace: list indentation would otherwise
 * turn quoted lines into a Markdown code block.
 */
export function normalizePassage(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Prefix that quotes a passage as a Markdown blockquote above the question
 * that is sent about it.
 */
export function quotePassage(passage: string): string {
  return `${normalizePassage(passage)
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n')}\n\n`;
}

/** Separate a leading quoted passage from the question asked about it. */
export function splitQuotedQuestion(question: string): {
  quote: string | null;
  question: string;
} {
  const lines = question.split('\n');
  let end = 0;
  while (end < lines.length && lines[end].startsWith('>')) end += 1;
  if (end === 0) return { quote: null, question };
  const quote = lines
    .slice(0, end)
    .map((line) => line.replace(/^>\s?/, ''))
    .join('\n')
    .trim();
  return { quote: quote || null, question: lines.slice(end).join('\n').trim() };
}

/** A quoted passage, in the composer or above the question it belongs to. */
export function QuoteCard({
  text,
  onRemove,
  removeLabel,
  className = '',
  surfaceClassName = 'bg-muted/60',
}: {
  text: string;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
  /** Background, so the card stands out on the surface it sits on. */
  surfaceClassName?: string;
}) {
  return (
    <div
      data-testid="conversation-quote"
      className={`flex items-start gap-2 rounded-2xl py-2 pl-3 pr-2 text-sm text-muted-foreground ${surfaceClassName} ${className}`}
    >
      <Quote aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p className="m-0 line-clamp-3 min-w-0 flex-1 whitespace-pre-line break-words">
        {text}
      </p>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * A floating button above text selected in an answer, which hands the
 * passage to the composer. Works with mouse, keyboard and touch selections,
 * since it follows `selectionchange` rather than pointer events.
 */
export function PassageAskButton({
  label,
  onAsk,
}: {
  label: string;
  onAsk: (passage: string) => void;
}) {
  const [passage, setPassage] = React.useState<SelectedPassage | null>(null);

  React.useEffect(() => {
    const update = () => setPassage(readSelectedPassage());
    document.addEventListener('selectionchange', update);
    // The conversation scrolls inside its own viewport: capture-phase scroll
    // events from any element keep the button next to the selection.
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      document.removeEventListener('selectionchange', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (!passage) return null;

  return createPortal(
    <button
      type="button"
      // Keep the selection alive until the click is handled.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        onAsk(passage.text);
        window.getSelection()?.removeAllRanges();
        setPassage(null);
      }}
      style={{
        position: 'fixed',
        top: Math.max(8, passage.top - 44),
        left: passage.left,
        transform: 'translateX(-50%)',
      }}
      className="z-50 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-md transition-colors hover:bg-muted"
    >
      <MessageSquareQuote aria-hidden className="size-4" />
      {label}
    </button>,
    document.body,
  );
}
