import {
  Building2,
  Globe,
  Mail,
  Phone,
  SquareArrowOutUpRight,
} from 'lucide-react';
import * as React from 'react';
import { getUiIcon } from './icons';
import type { ResolvedProps } from './registry';

export type ResourceLabels = {
  open: string;
};

const DEFAULT_RESOURCE_LABELS: ResourceLabels = {
  open: 'Open',
};

/** Translated resource card labels, provided by the conversation. */
export const ResourceLabelsContext = React.createContext<ResourceLabels>(
  DEFAULT_RESOURCE_LABELS,
);

/**
 * The card's link, if it is one a reader can safely follow: a web page, an
 * email address or a phone number. Anything else (javascript:, data:,
 * relative paths) is dropped.
 */
export function safeResourceHref(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  const candidate = href.trim();
  if (/^(?:mailto|tel):\S+$/i.test(candidate)) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/** Detail lines: one per line of content, blank lines dropped. */
export function resourceLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function defaultIcon(href: string | null) {
  if (href?.startsWith('mailto:')) return Mail;
  if (href?.startsWith('tel:')) return Phone;
  return href ? Globe : Building2;
}

/**
 * One place to turn to (an office, a portal, a form, a contact) with its
 * details and a single action that opens it.
 */
export function ResourceBlock({
  props,
  raw,
  inline,
}: {
  props: ResolvedProps;
  /** Detail lines, inline Markdown. */
  raw: string;
  /** Renders model text as inline Markdown with citations. */
  inline: (text: string) => React.ReactNode;
}) {
  const labels = React.useContext(ResourceLabelsContext);
  const title = typeof props.title === 'string' ? props.title : null;
  const href = safeResourceHref(props.href);
  const action = typeof props.action === 'string' ? props.action : null;
  const Icon = getUiIcon(props.icon) ?? defaultIcon(href);
  const lines = resourceLines(raw);
  const external = href?.startsWith('http') ?? false;

  if (!title && lines.length === 0) return null;

  return (
    <section
      aria-label={title ?? undefined}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200/80 p-3 dark:border-slate-800 sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted sm:size-20"
        >
          <Icon
            className="size-7 text-muted-foreground sm:size-8"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {title ? (
            <div className="min-w-0 font-semibold">{inline(title)}</div>
          ) : null}
          {lines.map((line, index) => (
            <div
              key={index}
              className="min-w-0 break-words text-sm text-muted-foreground"
            >
              {inline(line)}
            </div>
          ))}
        </div>
      </div>
      {href ? (
        <a
          href={href}
          {...(external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="min-w-0 truncate">{action ?? labels.open}</span>
          {external ? (
            <SquareArrowOutUpRight aria-hidden className="size-3.5 shrink-0" />
          ) : null}
        </a>
      ) : null}
    </section>
  );
}
