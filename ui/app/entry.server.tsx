import { themeSessionResolver } from '@eos/shared/theme/server';
import { createReadableStreamFromReadable } from '@react-router/node';
import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import type { EntryContext, RouterContextProvider } from 'react-router';
import { ServerRouter } from 'react-router';
import { Theme, ThemeProvider } from 'remix-themes';
import { getInstance } from './middleware/i18next';

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  routerContext: RouterContextProvider,
) {
  const themePromise = themeSessionResolver(request).then(
    ({ getTheme }) => getTheme() ?? null,
  );

  return isbot(request.headers.get('user-agent') || '')
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext,
        routerContext,
        themePromise,
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext,
        routerContext,
        themePromise,
      );
}

async function wrapWithProviders(
  children: React.ReactNode,
  theme: Theme | null,
  routerContext: RouterContextProvider,
) {
  return (
    <I18nextProvider i18n={getInstance(routerContext)}>
      <ThemeProvider specifiedTheme={theme} themeAction="/action/set-theme">
        {children}
      </ThemeProvider>
    </I18nextProvider>
  );
}

async function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  routerContext: RouterContextProvider,
  theme: Promise<Theme | null>,
) {
  const url = new URL(request.url);
  const themedChildren = await wrapWithProviders(
    <ServerRouter context={reactRouterContext} url={url.href} />,
    await theme,
    routerContext,
  );

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(themedChildren, {
      onAllReady() {
        shellRendered = true;
        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);
        responseHeaders.set('Content-Type', 'text/html');
        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          }),
        );
        pipe(body);
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;
        if (shellRendered) {
          console.error(error);
        }
      },
    });
    setTimeout(abort, ABORT_DELAY);
  });
}

async function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  routerContext: RouterContextProvider,
  theme: Promise<Theme | null>,
) {
  const url = new URL(request.url);
  const themedChildren = await wrapWithProviders(
    <ServerRouter context={reactRouterContext} url={url.href} />,
    await theme,
    routerContext,
  );

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(themedChildren, {
      onShellReady() {
        shellRendered = true;
        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);
        responseHeaders.set('Content-Type', 'text/html');
        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          }),
        );
        pipe(body);
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;
        if (shellRendered) {
          console.error(error);
        }
      },
    });
    setTimeout(abort, ABORT_DELAY);
  });
}
