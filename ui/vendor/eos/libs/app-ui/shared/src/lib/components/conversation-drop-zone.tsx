import { FileUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface ConversationDropZoneProps {
  /** Receives the dropped files. Without it the area takes no drops. */
  onDropFiles?: (files: File[]) => void;
  /** Supported file types, shown under the drop prompt. */
  hint?: string;
  className?: string;
  children: ReactNode;
}

const carriesFiles = (event: DragEvent<HTMLElement>) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

/**
 * The conversation area (messages and composer) as a drop target for files.
 * While files are dragged over it, an overlay covers the whole area so the
 * drop does not have to aim for the input.
 */
export function ConversationDropZone({
  onDropFiles,
  hint,
  className = '',
  children,
}: ConversationDropZoneProps) {
  const { t: translate, i18n } = useTranslation('conversation');
  const t = (key: string, fallback: string) =>
    i18n?.isInitialized ? translate(key, { defaultValue: fallback }) : fallback;
  const [isDragging, setIsDragging] = useState(false);
  // Entering a child fires dragenter on it before dragleave on its parent, so
  // a counter rather than a flag tells when the drag really left the area.
  const dragDepthRef = useRef(0);
  const enabled = Boolean(onDropFiles);

  const reset = useCallback(() => {
    dragDepthRef.current = 0;
    setIsDragging(false);
  }, []);

  // A drag that ends elsewhere (dropped outside, Escape) never sends this
  // area its dragleave, which would leave the overlay up.
  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('dragend', reset);
    window.addEventListener('drop', reset);
    return () => {
      window.removeEventListener('dragend', reset);
      window.removeEventListener('drop', reset);
    };
  }, [isDragging, reset]);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative ${className}`}
      data-testid="conversation-drop-zone"
      onDragEnter={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        dragDepthRef.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        if (!carriesFiles(event)) return;
        // Without this the browser opens the file instead of dropping it.
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(event) => {
        if (!carriesFiles(event)) return;
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setIsDragging(false);
      }}
      onDrop={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        reset();
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length) onDropFiles?.(files);
      }}
    >
      {children}
      {isDragging ? (
        <div
          aria-hidden
          data-testid="conversation-drop-overlay"
          className="pointer-events-none absolute inset-2 z-40 flex items-center justify-center rounded-3xl border-2 border-dashed border-zinc-400 bg-zinc-50/85 backdrop-blur-[2px] duration-150 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-[0.99] dark:border-zinc-500 dark:bg-zinc-900/85 sm:inset-4"
        >
          <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
              <FileUp className="size-6" />
            </span>
            <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              {t(
                'attachments.dropTitle',
                'Drop files to add them to the conversation',
              )}
            </p>
            {hint ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
