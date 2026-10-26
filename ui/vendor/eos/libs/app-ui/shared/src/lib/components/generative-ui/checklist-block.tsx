import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { checklistToMarkdown, parseChecklist } from './checklist-data';
import type { ResolvedProps } from './registry';

export type ChecklistLabels = {
  label: string;
  progress: (done: number, total: number) => string;
  copy: string;
  copied: string;
};

const DEFAULT_CHECKLIST_LABELS: ChecklistLabels = {
  label: 'Checklist',
  progress: (done, total) => `${done} of ${total} done`,
  copy: 'Copy list',
  copied: 'Copied',
};

/** Translated checklist labels, provided by the conversation. */
export const ChecklistLabelsContext = React.createContext<ChecklistLabels>(
  DEFAULT_CHECKLIST_LABELS,
);

const itemKey = (groupIndex: number, itemIndex: number) =>
  `${groupIndex}:${itemIndex}`;

/**
 * A checklist the reader can tick off while working through it. Ticks live in
 * the page only; the answer itself is never changed.
 */
export function ChecklistBlock({
  props,
  raw,
  inline,
}: {
  props: ResolvedProps;
  /** The task lines, streamed or complete. */
  raw: string;
  /** Renders model text as inline Markdown with citations. */
  inline: (text: string) => React.ReactNode;
}) {
  const labels = React.useContext(ChecklistLabelsContext);
  const id = React.useId();
  const groups = React.useMemo(() => parseChecklist(raw), [raw]);
  const [ticks, setTicks] = React.useState<Record<string, boolean>>({});
  const [copied, setCopied] = React.useState(false);
  const title = typeof props.title === 'string' ? props.title : null;

  const isChecked = (groupIndex: number, itemIndex: number) =>
    ticks[itemKey(groupIndex, itemIndex)] ??
    groups[groupIndex].items[itemIndex].checked;
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const done = groups.reduce(
    (sum, group, groupIndex) =>
      sum +
      group.items.filter((_, itemIndex) => isChecked(groupIndex, itemIndex))
        .length,
    0,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        checklistToMarkdown(title, groups, isChecked),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the list stays selectable.
    }
  };

  if (total === 0 && !title) return null;

  return (
    <section
      aria-label={title ?? labels.label}
      className="flex min-w-0 flex-col gap-3 rounded-xl border p-3 sm:p-4"
    >
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <div className="min-w-0 font-semibold">
          {title ? inline(title) : labels.label}
        </div>
        <div className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {labels.progress(done, total)}
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={labels.progress(done, total)}
        className="h-1.5 w-full shrink-0 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
        />
      </div>
      {groups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {groupIndex > 0 ? (
            <div role="separator" className="h-px w-full bg-border/70" />
          ) : null}
          <div className="flex min-w-0 flex-col gap-2">
            {group.title ? (
              <div className="font-medium">{inline(group.title)}</div>
            ) : null}
            {group.items.map((item, itemIndex) => {
              const inputId = `${id}-${groupIndex}-${itemIndex}`;
              const checked = isChecked(groupIndex, itemIndex);
              return (
                <div
                  key={itemIndex}
                  className="flex min-w-0 items-start gap-2.5"
                >
                  <span className="relative mt-[0.2em] inline-flex size-[18px] shrink-0">
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        setTicks((current) => ({
                          ...current,
                          [itemKey(groupIndex, itemIndex)]:
                            event.target.checked,
                        }))
                      }
                      className="peer size-[18px] cursor-pointer appearance-none rounded-full border border-slate-300 bg-background transition-colors checked:border-foreground checked:bg-foreground hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 dark:border-slate-600"
                    />
                    <Check
                      aria-hidden
                      strokeWidth={3}
                      className="pointer-events-none absolute inset-0 m-auto size-3 text-background opacity-0 transition-opacity peer-checked:opacity-100"
                    />
                  </span>
                  <label
                    htmlFor={inputId}
                    className={`min-w-0 flex-1 cursor-pointer transition-colors ${checked ? 'text-muted-foreground line-through decoration-muted-foreground/60' : ''}`}
                  >
                    {inline(item.text)}
                  </label>
                </div>
              );
            })}
          </div>
        </React.Fragment>
      ))}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={copy}
          disabled={total === 0}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          {copied ? (
            <Check aria-hidden className="size-3.5" />
          ) : (
            <Copy aria-hidden className="size-3.5" />
          )}
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </section>
  );
}
