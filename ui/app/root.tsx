import '@eos/shared/styles/default.css';
import './styles.css';
import { SidebarProvider, Toaster } from '@eos/shared/ui';
import { themeSessionResolver } from '@eos/shared/theme/server';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { LinksFunction, RouterContextProvider } from 'react-router';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';
import { PreventFlashOnWrongTheme, ThemeProvider } from 'remix-themes';
import type { Route } from './+types/root';
import { buildMeta } from './lib/meta';
import { toLanguage } from './locales/languages';
import { getInstance, i18nextMiddleware } from './middleware/i18next';

export const meta = ({ loaderData }: Route.MetaArgs) =>
  buildMeta({ locale: loaderData?.locale });

export const links: LinksFunction = () => [
  { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  { rel: 'shortcut icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' },
];

export const middleware = [i18nextMiddleware];

export async function loader({ context, request }: Route.LoaderArgs) {
  const i18n = getInstance(context as Readonly<RouterContextProvider>);
  const locale = toLanguage(i18n.language);
  if (i18n.language !== locale) await i18n.changeLanguage(locale);
  const { getTheme } = await themeSessionResolver(request);
  return { theme: getTheme() ?? null, locale };
}

export default function Root() {
  const { theme, locale } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();

  // Follow the server after the language switcher revalidates this loader
  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale);
  }, [i18n, locale]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <meta name="apple-mobile-web-app-title" content="Rahmenabkommen GPT" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeProvider specifiedTheme={theme} themeAction="/action/set-theme">
          <SidebarProvider>
            <div
              data-mobile-document-scroll
              className="flex min-h-screen w-full min-w-0 flex-col"
            >
              {/* Mobile styles stretch each direct child to the full screen
                  height, so header and page share this single wrapper */}
              <div className="flex min-w-0 flex-1 flex-col">
                <Outlet />
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
          <ScrollRestoration />
          <Scripts />
          <PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />
        </ThemeProvider>
      </body>
    </html>
  );
}
