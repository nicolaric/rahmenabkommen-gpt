import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STATUS_PAGE_URL =
  'https://yeos.statuspage.io/api/v2/incidents/unresolved.json';
const STATUS_PAGE_LINK = 'https://yeos.statuspage.io/';
const POLL_INTERVAL_MS = 60_000;

interface StatusPageIncident {
  components?: Array<{ name?: string }>;
}

interface StatusPageResponse {
  incidents?: StatusPageIncident[];
}

/**
 * Shows the current response-generation incident from the public status page.
 * The page is polled so the banner disappears when the incident is resolved.
 */
export function ResponseGenerationStatusBanner() {
  const { t } = useTranslation('conversation');
  const [isAffected, setIsAffected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadStatus = async () => {
      try {
        const response = await fetch(STATUS_PAGE_URL, {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const status = (await response.json()) as StatusPageResponse;
        const responseGenerationIncident = status.incidents?.some((incident) =>
          incident.components?.some(
            (component) => component.name === 'Response Generation',
          ),
        );

        if (!cancelled) {
          setIsAffected(responseGenerationIncident ?? false);
        }
      } catch {
        // A status-page failure should never affect the conversation composer.
      }
    };

    void loadStatus();
    const interval = window.setInterval(
      () => void loadStatus(),
      POLL_INTERVAL_MS,
    );

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  if (!isAffected) return null;

  return (
    <div
      role="alert"
      className="flex w-full items-start gap-2 px-1 text-sm text-amber-800 dark:text-amber-200"
    >
      <span
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500"
      />
      <p>
        <span className="font-semibold">
          {t('serviceIncident.title', {
            defaultValue:
              'Response generation is currently experiencing an outage',
          })}
        </span>{' '}
        {t('serviceIncident.description', {
          defaultValue:
            'Some responses may be delayed or unavailable while we work on a fix.',
        })}{' '}
        <a
          href={STATUS_PAGE_LINK}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          {t('serviceIncident.viewStatus', {
            defaultValue: 'View status page',
          })}
        </a>
      </p>
    </div>
  );
}
