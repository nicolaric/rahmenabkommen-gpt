import { Spinner } from '@eos/shared/ui';
import {
  AlertCircle,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Where a file added to the composer is on its way to being sendable. */
export type ConversationInputAttachmentState =
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

/** A file in the composer, as the input shows it. */
export type ConversationInputAttachment = {
  /** Stable key, also passed back when the file is removed. */
  id: string;
  name: string;
  fileType?: string | null;
  state: ConversationInputAttachmentState;
  /** Why the file failed, shown in place of its type. */
  error?: string | null;
};

const AUDIO_TYPES = new Set([
  'audio',
  'mp3',
  'm4a',
  'wav',
  'ogg',
  'opus',
  'flac',
]);
const VIDEO_TYPES = new Set(['video', 'mp4', 'mov', 'avi', 'mkv', 'webm']);
const SPREADSHEET_TYPES = new Set(['xlsx', 'xls', 'csv']);
const IMAGE_TYPES = new Set([
  'image',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'bmp',
  'tif',
  'tiff',
]);

const extensionOf = (name: string) =>
  name.includes('.') ? (name.split('.').pop() ?? '') : '';

/** The short type shown under a file name, e.g. "PDF". */
export function attachmentTypeLabel(
  name: string,
  fileType?: string | null,
): string | null {
  // Audio, video and images are stored under a family name; the extension
  // says more.
  const extension = extensionOf(name);
  const type =
    fileType && !['audio', 'video', 'image'].includes(fileType)
      ? fileType
      : extension || fileType;
  return type ? type.replace(/^\./, '').toUpperCase() : null;
}

export function attachmentIcon(
  name: string,
  fileType?: string | null,
): LucideIcon {
  const type = (fileType || extensionOf(name)).toLowerCase();
  if (AUDIO_TYPES.has(type)) return FileAudio;
  if (VIDEO_TYPES.has(type)) return FileVideo;
  if (SPREADSHEET_TYPES.has(type)) return FileSpreadsheet;
  if (IMAGE_TYPES.has(type)) return FileImage;
  return FileText;
}

export interface ConversationAttachmentCardProps {
  attachment: ConversationInputAttachment;
  statusLabel: string;
  onRemove?: () => void;
  removeLabel?: string;
}

/**
 * A file in the composer. It mirrors ConversationDocumentCard so files and
 * selected documents read as one row of context above the question.
 */
export function ConversationAttachmentCard({
  attachment,
  statusLabel,
  onRemove,
  removeLabel,
}: ConversationAttachmentCardProps) {
  const isPending =
    attachment.state === 'uploading' || attachment.state === 'processing';
  const isFailed = attachment.state === 'failed';
  const Icon = attachmentIcon(attachment.name, attachment.fileType);

  return (
    <div
      role="group"
      aria-label={attachment.name}
      aria-busy={isPending}
      data-testid="conversation-attachment"
      data-state={attachment.state}
      className={`group relative flex min-w-0 max-w-[15rem] items-center gap-2.5 rounded-2xl border bg-white py-2 pl-3 pr-4 text-left dark:bg-zinc-900 ${
        isFailed
          ? 'border-red-300 dark:border-red-900'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {isPending ? (
        <Spinner className="size-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
      ) : isFailed ? (
        <AlertCircle className="size-5 shrink-0 text-red-600 dark:text-red-400" />
      ) : (
        <Icon className="size-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
      )}
      <div className="min-w-0">
        <p
          className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          title={attachment.name}
        >
          {attachment.name}
        </p>
        <p
          className={`truncate text-xs ${
            isFailed
              ? 'text-red-600 dark:text-red-400'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title={statusLabel}
        >
          {statusLabel}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          /* A failed file blocks sending until it is removed, so its remove
             button does not wait for a hover that touch screens lack. */
          className={`absolute -right-1.5 -top-1.5 h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-zinc-500 shadow-sm hover:text-zinc-900 group-hover:flex focus-visible:flex dark:border-gray-700 dark:bg-zinc-800 dark:hover:text-zinc-100 ${
            isFailed ? 'flex' : 'hidden'
          }`}
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/** A file sent with a question, shown with it in the conversation. */
export function ConversationAttachmentChip({
  name,
  fileType,
}: {
  name: string;
  fileType?: string | null;
}) {
  const Icon = attachmentIcon(name, fileType);
  const typeLabel = attachmentTypeLabel(name, fileType);

  return (
    <div
      role="group"
      aria-label={name}
      data-testid="message-attachment"
      className="flex min-w-0 max-w-[15rem] items-center gap-2 rounded-xl border border-gray-200 bg-white py-1.5 pl-2.5 pr-3 dark:border-gray-700 dark:bg-zinc-900"
    >
      <Icon className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
      <span
        className="min-w-0 truncate text-sm text-zinc-900 dark:text-zinc-100"
        title={name}
      >
        {name}
      </span>
      {typeLabel ? (
        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          {typeLabel}
        </span>
      ) : null}
    </div>
  );
}
