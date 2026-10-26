import { AudioLines } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * The question being dictated, shown as the user's question bubble while
 * they talk. It is sent by itself once they stop.
 */
export function LiveQuestionBubble({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const { t: translate, i18n } = useTranslation('conversation');
  const t = (key: string, fallback: string) =>
    i18n?.isInitialized ? translate(key, { defaultValue: fallback }) : fallback;

  return (
    <div
      className={`mx-0 flex min-w-0 max-w-full flex-col items-end self-end sm:mx-2 ${className}`}
      data-testid="live-question"
    >
      <div className="flex min-w-0 max-w-full flex-col gap-1 rounded-l-xl rounded-t-xl rounded-br-sm border border-gray-200 bg-gray-100 p-2 dark:border-gray-800 dark:bg-gray-900">
        {text ? (
          <p className="m-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-gray-900 dark:text-gray-100">
            {text}
          </p>
        ) : null}
        <span className="inline-flex items-center gap-1.5 self-end text-xs text-gray-500 dark:text-gray-400">
          <AudioLines
            aria-hidden
            className="size-3.5 text-red-600 motion-safe:animate-pulse dark:text-red-400"
          />
          {t('dictation.listening', 'Listening...')}
        </span>
      </div>
    </div>
  );
}
