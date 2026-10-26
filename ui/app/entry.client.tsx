import Backend from 'i18next-fetch-backend';
import i18next from 'i18next';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { HydratedRouter } from 'react-router/dom';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import { ThemeProvider } from 'remix-themes';
import { getInitialThemeFromDom } from '@eos/shared/theme/client';
import { reloadOnStaleChunks } from '@eos/utils';

reloadOnStaleChunks();

async function main() {
  await i18next
    .use(initReactI18next)
    .use(Backend)
    .use(I18nextBrowserLanguageDetector)
    .init({
      fallbackLng: 'de',
      supportedLngs: ['de'],
      preload: ['de'],
      ns: ['common', 'conversation'],
      defaultNS: 'common',
      detection: {
        order: ['htmlTag', 'cookie'],
        caches: ['cookie'],
      },
      backend: {
        loadPath: `/locales/{{lng}}/{{ns}}?v=${import.meta.env.BUILD_ID}`,
      },
      interpolation: {
        escapeValue: false,
      },
      debug: import.meta.env.DEV,
    });

  const initialTheme = getInitialThemeFromDom();

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <ThemeProvider
          specifiedTheme={initialTheme}
          themeAction="/action/set-theme"
        >
          <StrictMode>
            <HydratedRouter />
          </StrictMode>
        </ThemeProvider>
      </I18nextProvider>,
    );
  });
}

main().catch((error) => console.error('Client init failed:', error));
