/**
 * Same-origin proxy in front of eos-api for this public, unauthenticated app.
 * The browser only ever talks to this route — never to eos-api directly — so
 * the organization-scoped service API key never reaches client JS, and every
 * request is pinned to our organization regardless of what the client sends.
 *
 * Only a small allowlist of conversation-related paths is forwarded; this
 * key is privileged, so it must not become an open relay to the rest of
 * the API. Same approach as swissmem-ui in project-eos.
 */
import type { Route } from './+types/api.proxy.$';
import { eosUrl, getEosEnv } from '../lib/eos.server';

const ALLOWED_PATHS = [
  /^chat\/completions$/,
  /^conversations\/cancel\/[^/]+$/,
  /^conversations\/messages\/[^/]+\/rating$/,
  /^files\/batch-metadata$/,
  /^files\/[^/]+\/images\/[^/]+$/,
  /^files\/[^/]+\/download$/,
];

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
  'content-length',
]);

async function forward(request: Request, path: string) {
  if (!ALLOWED_PATHS.some((pattern) => pattern.test(path))) {
    return new Response('Not found', { status: 403 });
  }

  const { apiKey } = getEosEnv();
  const upstream = await fetch(eosUrl(path, new URL(request.url).search), {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
      Accept: request.headers.get('accept') ?? 'application/json',
      Authorization: `Bearer ${apiKey}`,
      // Answers are rendered by our chat UI, so ask for visual blocks.
      'X-Yeos-Inline-UI': '1',
    },
    body: ['GET', 'HEAD'].includes(request.method)
      ? undefined
      : await request.text(),
  });

  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function loader({ request, params }: Route.LoaderArgs) {
  return forward(request, params['*'] ?? '');
}

export async function action({ request, params }: Route.ActionArgs) {
  return forward(request, params['*'] ?? '');
}
