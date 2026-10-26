'use client';

import * as React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@eos/shared/ui';
import { cn } from '@eos/utils';
import {
  ArrowUpRight,
  Brain,
  ChevronDown,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
} from 'lucide-react';

export type InlineCitationKind = 'web' | 'image' | 'sheet' | 'file' | 'brain';

const KIND_ICONS: Record<InlineCitationKind, typeof FileText> = {
  web: Globe,
  image: FileImage,
  sheet: FileSpreadsheet,
  file: FileText,
  brain: Brain,
};

const KIND_TILES: Record<InlineCitationKind, string> = {
  web: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  image: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  sheet: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  file: 'bg-primary/10 text-primary',
  brain: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

type InlineCitationCardContextValue = {
  open: boolean;
  toggle: () => void;
};

const InlineCitationCardContext =
  React.createContext<InlineCitationCardContextValue | null>(null);

function InlineCitationKindIcon({
  kind,
  className,
}: {
  kind: InlineCitationKind;
  className?: string;
}) {
  const Icon = KIND_ICONS[kind];
  return (
    <Icon aria-hidden="true" className={cn('size-3 shrink-0', className)} />
  );
}

/**
 * Wraps a chip. `data-citation` lets the claim text right before it light up
 * while the chip is hovered or its card is open.
 */
function InlineCitation({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-citation=""
      className={cn('inline-flex items-baseline gap-1', className)}
      {...props}
    />
  );
}

/** The sentence a chip supports, tinted while that chip is active. */
function InlineCitationClaim({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-citation-claim=""
      className={cn(
        'rounded-[3px] transition-colors duration-150 motion-reduce:transition-none',
        '[&:has(+[data-citation]_[data-citation-trigger]:hover)]:bg-primary/10',
        '[&:has(+[data-citation]_[data-open])]:bg-primary/10',
        className,
      )}
      {...props}
    />
  );
}

function InlineCitationText({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function InlineCitationCard({
  children,
  ...props
}: React.ComponentProps<typeof HoverCard>) {
  const [open, setOpen] = React.useState(false);

  return (
    <InlineCitationCardContext.Provider
      value={{
        open,
        toggle: () => setOpen((current) => !current),
      }}
    >
      <HoverCard {...props} open={open} onOpenChange={setOpen}>
        {children}
      </HoverCard>
    </InlineCitationCardContext.Provider>
  );
}

type InlineCitationCardTriggerProps = React.ComponentProps<'button'> & {
  sources: string[];
};

function InlineCitationCardTrigger({
  sources,
  className,
  children,
  onClick,
  ...props
}: InlineCitationCardTriggerProps) {
  const label = children ?? String(sources.length || 1);
  const card = React.useContext(InlineCitationCardContext);

  return (
    // The default 600ms open delay feels unresponsive while reading; a short
    // delay still ignores a pointer that only passes over the chip.
    <HoverCardTrigger asChild delay={150} closeDelay={150}>
      <button
        type="button"
        data-citation-trigger=""
        data-open={card?.open ? '' : undefined}
        className={cn(
          'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-primary/20 bg-primary/5 px-1.5 text-[11px] font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/10 data-[open]:border-primary/40 data-[open]:bg-primary/10',
          className,
        )}
        aria-expanded={card?.open}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) card?.toggle();
        }}
        {...props}
      >
        {label}
      </button>
    </HoverCardTrigger>
  );
}

function InlineCitationCardBody({
  className,
  ...props
}: React.ComponentProps<typeof HoverCardContent>) {
  return (
    <HoverCardContent
      side="top"
      align="start"
      sideOffset={6}
      className={cn(
        'flex max-h-[min(26rem,var(--available-height))] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl p-0 shadow-lg motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

type InlineCitationSourceProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  kind: InlineCitationKind;
  title: string;
  /** Shown when `title` is shortened, e.g. the full file name. */
  fullTitle?: string;
  meta?: string;
};

/** A source's icon tile, name and type/page line. */
function InlineCitationSource({
  kind,
  title,
  fullTitle,
  meta,
  className,
  ...props
}: InlineCitationSourceProps) {
  return (
    <div
      className={cn('flex min-w-0 flex-1 items-center gap-2.5', className)}
      {...props}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          KIND_TILES[kind],
        )}
      >
        <InlineCitationKindIcon kind={kind} className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col text-left">
        <span
          className="truncate text-sm font-medium leading-5 text-foreground"
          title={fullTitle ?? title}
        >
          {title}
        </span>
        {meta ? (
          <span className="truncate text-xs leading-4 text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function InlineCitationSection({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('px-4 py-3', className)} {...props} />;
}

/** Scrolls when a source has several long passages. */
function InlineCitationPassages({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3',
        className,
      )}
      {...props}
    />
  );
}

type InlineCitationQuoteProps = React.ComponentProps<'blockquote'> & {
  label?: string;
};

function InlineCitationQuote({
  label,
  className,
  children,
  ...props
}: InlineCitationQuoteProps) {
  return (
    <figure className="space-y-1">
      {label ? (
        <figcaption className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </figcaption>
      ) : null}
      <blockquote
        className={cn(
          'line-clamp-6 rounded-lg bg-muted/60 px-3 py-2 text-[13px] leading-relaxed text-foreground/85',
          className,
        )}
        {...props}
      >
        {children}
      </blockquote>
    </figure>
  );
}

type InlineCitationActionProps = {
  label: string;
  className?: string;
} & (
  | { href: string; download?: string; onClick?: never }
  | { onClick: () => void; href?: never; download?: never }
);

const ACTION_CLASSES =
  'group/action flex w-full shrink-0 items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none';

/** Full-width footer that opens the cited source. */
function InlineCitationAction({
  label,
  className,
  ...props
}: InlineCitationActionProps) {
  const content = (
    <>
      <span className="truncate">{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5 motion-reduce:transition-none"
      />
    </>
  );

  if (props.href !== undefined) {
    return (
      <a
        href={props.href}
        className={cn(ACTION_CLASSES, className)}
        aria-label={label}
        target="_blank"
        rel="noopener noreferrer"
        // Ignored for the API's other origin, where the file opens in the
        // new tab instead.
        download={props.download}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cn(ACTION_CLASSES, className)}
      aria-label={label}
      onClick={props.onClick}
    >
      {content}
    </button>
  );
}

type InlineCitationGroupContextValue = {
  active: string;
  setActive: (value: string) => void;
};

const InlineCitationGroupContext =
  React.createContext<InlineCitationGroupContextValue | null>(null);

/** Several sources behind one chip: one row each, one expanded at a time. */
function InlineCitationGroup({
  defaultValue,
  className,
  ...props
}: React.ComponentProps<'div'> & { defaultValue: string }) {
  const [active, setActive] = React.useState(defaultValue);

  return (
    <InlineCitationGroupContext.Provider value={{ active, setActive }}>
      <div
        className={cn(
          'min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto',
          className,
        )}
        {...props}
      />
    </InlineCitationGroupContext.Provider>
  );
}

function InlineCitationGroupItem({
  value,
  summary,
  children,
}: {
  value: string;
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const group = React.useContext(InlineCitationGroupContext);
  const expanded = group?.active === value;
  const id = React.useId();

  return (
    <div className={cn(expanded && 'bg-muted/30')}>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => group?.setActive(value)}
      >
        {summary}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none',
            expanded && 'rotate-180',
          )}
        />
      </button>
      {expanded ? <div id={id}>{children}</div> : null}
    </div>
  );
}

export {
  InlineCitation,
  InlineCitationAction,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationClaim,
  InlineCitationGroup,
  InlineCitationGroupItem,
  InlineCitationKindIcon,
  InlineCitationPassages,
  InlineCitationQuote,
  InlineCitationSection,
  InlineCitationSource,
  InlineCitationText,
};
