import { initReactI18next } from 'react-i18next';
import { createI18nextMiddleware } from 'remix-i18next';
import resources from '../locales';

// German only for now; add locales here and in app/locales to translate
export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: ['de'],
      fallbackLanguage: 'de',
    },
    i18next: { resources, defaultNS: 'common' },
    plugins: [initReactI18next],
  });
