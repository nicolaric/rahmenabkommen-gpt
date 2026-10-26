import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createCookie, type RouterContextProvider } from 'react-router';
import { createI18nextMiddleware } from 'remix-i18next';
import resources from '../locales';
import { fallbackLanguage, languages } from '../locales/languages';

// Set by the language switcher; without it the Accept-Language header decides
export const localeCookie = createCookie('lng', {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365,
});

export const [i18nextMiddleware, getLocale, getMiddlewareInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: [...languages],
      fallbackLanguage,
      cookie: localeCookie,
    },
    i18next: { resources, defaultNS: 'common' },
    plugins: [initReactI18next],
  });

/**
 * The middleware doesn't run for non-GET requests that match no route, but
 * the error page still renders, so fall back to a fresh German instance
 * instead of crashing with "No value found for context".
 */
export function getInstance(context: Readonly<RouterContextProvider>) {
  try {
    return getMiddlewareInstance(context);
  } catch {
    const instance = createInstance({
      resources,
      defaultNS: 'common',
      lng: fallbackLanguage,
    });
    instance.use(initReactI18next).init();
    return instance;
  }
}
