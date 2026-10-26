import { FileText, Tag, X } from 'lucide-react';

export type ConversationDocumentCardKind = 'document' | 'tag';

export interface ConversationDocumentCardProps {
  label: string;
  description: string;
  kind?: ConversationDocumentCardKind;
  onRemove?: () => void;
  removeLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function ConversationDocumentCard({
  label,
  description,
  kind = 'document',
  onRemove,
  removeLabel,
  onClick,
  disabled = false,
  ariaLabel,
}: ConversationDocumentCardProps) {
  const content = (
    <>
      {kind === 'tag' ? (
        <Tag className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
      ) : (
        <FileText className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-zinc-500 shadow-sm hover:text-zinc-900 group-hover:flex focus-visible:flex dark:border-gray-700 dark:bg-zinc-800 dark:hover:text-zinc-100"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </>
  );
  const className =
    'group relative flex min-w-0 max-w-[15rem] items-center gap-2.5 rounded-2xl border border-gray-200 bg-white py-2 pl-3 pr-4 text-left dark:border-gray-700 dark:bg-zinc-900';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        className={`${className} disabled:cursor-wait disabled:opacity-70`}
      >
        {content}
      </button>
    );
  }

  return (
    <div role="group" aria-label={label} className={className}>
      {content}
    </div>
  );
}
