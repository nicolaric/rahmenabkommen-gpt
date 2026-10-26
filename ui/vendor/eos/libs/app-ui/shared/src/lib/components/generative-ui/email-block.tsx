import { Check, Copy, SquareArrowOutUpRight } from 'lucide-react';
import * as React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toFallbackMarkdown } from './parse';
import type { ResolvedProps } from './registry';

export type EmailLabels = {
  label: string;
  recipient: string;
  subject: string;
  body: string;
  copy: string;
  copied: string;
  openInMail: string;
};

const DEFAULT_EMAIL_LABELS: EmailLabels = {
  label: 'Email draft',
  recipient: 'Recipient',
  subject: 'Subject',
  body: 'Message',
  copy: 'Copy',
  copied: 'Copied',
  openInMail: 'Open in mail app',
};

/** Translated email draft labels, provided by the conversation. */
export const EmailLabelsContext =
  React.createContext<EmailLabels>(DEFAULT_EMAIL_LABELS);

/**
 * The email body as plain text: Markdown emphasis markers removed, links as
 * `text (url)`, list markers kept. Used where formatting cannot travel, i.e.
 * `mailto:` links and the plain-text clipboard flavour.
 */
export function emailPlainText(markdown: string): string {
  return markdown
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_match, text: string, url: string) =>
        text === url ? url : `${text} (${url})`,
    )
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2')
    .replace(/(^|[^\w*])([*_])(?=\S)([^*_\n]*?\S)\2(?=[^\w*]|$)/gm, '$1$3')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '$1')
    .replace(/^(\s*)\* /gm, '$1- ');
}

/**
 * Markdown joins single line breaks into one paragraph, but an email's line
 * breaks are meaningful (greetings, sign-offs), so each one becomes a hard
 * break.
 */
function withHardLineBreaks(markdown: string): string {
  return markdown.replace(/([^\n])\n(?!\n)/g, '$1  \n');
}

// What an email can carry: no headings, tables, code or images.
const EMAIL_ELEMENTS = [
  'p',
  'br',
  'strong',
  'em',
  'del',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
];

const emailMarkdownComponents = {
  a: ({ href, children }: React.ComponentProps<'a'>) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

/** A `mailto:` link that opens the draft in the user's own mail app. */
export function buildMailtoHref(draft: {
  to: string;
  subject: string;
  body: string;
}): string {
  const params = [
    draft.subject ? `subject=${encodeURIComponent(draft.subject)}` : '',
    draft.body
      ? `body=${encodeURIComponent(
          emailPlainText(draft.body).replace(/\r?\n/g, '\r\n'),
        )}`
      : '',
  ].filter(Boolean);
  const to = draft.to
    .split(/[,;]/)
    .map((address) => encodeURIComponent(address.trim()))
    .filter(Boolean)
    .join(',');
  return `mailto:${to}${params.length ? `?${params.join('&')}` : ''}`;
}

const fieldClasses =
  'col-start-1 row-start-1 w-full min-w-0 resize-none overflow-hidden border-none bg-transparent p-0 break-words whitespace-pre-wrap outline-none placeholder:text-muted-foreground/70 focus:ring-0';

/**
 * A textarea that grows with its text: an invisible copy of the value sits in
 * the same grid cell and sets the height.
 */
function GrowingField({
  value,
  onChange,
  className,
  ...rest
}: Omit<React.ComponentProps<'textarea'>, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`grid min-w-0 ${className ?? ''}`}>
      <textarea
        {...rest}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClasses}
      />
      <span
        aria-hidden
        className="invisible col-start-1 row-start-1 min-w-0 break-words whitespace-pre-wrap"
      >
        {value}{' '}
      </span>
    </div>
  );
}

const toolbarButton =
  'inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-40';

/**
 * An email the assistant drafted, as an editable card. Nothing is sent from
 * here: the draft is copied or handed to the user's mail app.
 */
export function EmailBlock({
  props,
  raw,
  pending,
}: {
  props: ResolvedProps;
  /** The email body, Markdown with emphasis, lists and links. */
  raw: string;
  /** The body is still streaming in. */
  pending: boolean;
}) {
  const labels = React.useContext(EmailLabelsContext);
  const streamed = {
    to: typeof props.to === 'string' ? props.to : '',
    subject: typeof props.subject === 'string' ? props.subject : '',
    // Layout blocks cannot travel in an email: keep their text as Markdown.
    body: toFallbackMarkdown(raw),
  };
  // Fields follow the stream until the user edits them.
  const [edits, setEdits] = React.useState<Partial<typeof streamed>>({});
  const draft = { ...streamed, ...edits };
  const [copied, setCopied] = React.useState(false);
  // The body shows formatted; clicking it edits the Markdown source.
  const [editingBody, setEditingBody] = React.useState(false);
  // Stays mounted (hidden while editing), so copy can read its HTML.
  const formattedBodyRef = React.useRef<HTMLDivElement>(null);

  const edit = (field: keyof typeof streamed) => (value: string) =>
    setEdits((current) => ({ ...current, [field]: value }));

  const copy = async () => {
    const plain = emailPlainText(draft.body);
    try {
      const html = formattedBodyRef.current?.innerHTML;
      if (html && typeof ClipboardItem !== 'undefined') {
        // Both flavours: mail apps paste the formatting, plain-text fields
        // get clean text without Markdown markers.
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the text stays selectable.
    }
  };

  const startEditingBody = () => {
    if (!pending) setEditingBody(true);
  };

  return (
    <section
      aria-label={draft.subject || labels.label}
      aria-busy={pending || undefined}
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-background shadow-[0_4px_40px_rgb(0_0_0/0.03)] transition-colors hover:border-slate-300/80 dark:border-slate-800 dark:hover:border-slate-700"
    >
      <header className="flex min-w-0 items-center gap-2 py-2 pe-2 ps-5">
        <div className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
          {draft.subject || labels.label}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={toolbarButton}
            onClick={copy}
            aria-disabled={pending || !draft.body || undefined}
            aria-label={copied ? labels.copied : labels.copy}
            title={copied ? labels.copied : labels.copy}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
          <a
            className={toolbarButton}
            href={buildMailtoHref(draft)}
            aria-disabled={pending || undefined}
            aria-label={labels.openInMail}
            title={labels.openInMail}
          >
            <SquareArrowOutUpRight className="size-4" />
          </a>
        </div>
      </header>
      <div className="px-5">
        <div className="border-b border-border/60 py-1.5">
          <input
            type="text"
            value={draft.to}
            onChange={(event) => edit('to')(event.target.value)}
            readOnly={pending}
            placeholder={labels.recipient}
            aria-label={labels.recipient}
            className="w-full min-w-0 border-none bg-transparent p-0 text-base outline-none placeholder:text-muted-foreground/70 focus:ring-0"
          />
        </div>
      </div>
      <GrowingField
        value={draft.subject}
        onChange={edit('subject')}
        readOnly={pending}
        placeholder={labels.subject}
        aria-label={labels.subject}
        maxLength={240}
        className="px-5 pb-3 pt-3 font-medium"
      />
      <div className="mx-5 border-t border-border/60" />
      {editingBody && (
        <GrowingField
          value={draft.body}
          onChange={edit('body')}
          onBlur={() => setEditingBody(false)}
          autoFocus
          aria-label={labels.body}
          className="px-5 pb-5 pt-3 leading-relaxed"
        />
      )}
      <div
        ref={formattedBodyRef}
        hidden={editingBody}
        role="textbox"
        aria-multiline
        aria-readonly={pending || undefined}
        aria-label={labels.body}
        tabIndex={pending ? -1 : 0}
        onClick={(event) => {
          // Links stay clickable; anywhere else edits the text.
          if (!(event.target as HTMLElement).closest('a')) startEditingBody();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.target === event.currentTarget) {
            event.preventDefault();
            startEditingBody();
          }
        }}
        className="min-w-0 cursor-text break-words px-5 pb-5 pt-3 leading-relaxed outline-none [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-6 [&_p+p]:mt-3 [&_p+ol]:mt-3 [&_p+ul]:mt-3 [&_ol+p]:mt-3 [&_ul+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6"
      >
        <Markdown
          remarkPlugins={[remarkGfm]}
          allowedElements={EMAIL_ELEMENTS}
          unwrapDisallowed
          components={emailMarkdownComponents}
        >
          {withHardLineBreaks(draft.body)}
        </Markdown>
      </div>
    </section>
  );
}
