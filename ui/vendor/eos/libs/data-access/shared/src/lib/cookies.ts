import { z } from 'zod';

export type RequestContext = {
  request?: Request;
  cookie?: string;
  requestSchema?: z.ZodTypeAny;
  responseSchema?: z.ZodTypeAny;
  schemaName?: string;
  requestBody?: unknown;
};

export function getCookieHeader(cookie: string): { Cookie: string } {
  return { Cookie: cookie };
}

// Helper to get cookies from request headers
export function getCookiesFromRequest(request: Request): string {
  return request.headers.get('Cookie') || '';
}

function getCookieFromContext(context?: RequestContext): string {
  if (!context) {
    return '';
  }

  return context.cookie ?? context.request?.headers.get('Cookie') ?? '';
}

function resolveServerApiUrl(url: string, context?: RequestContext): string {
  if (!context?.request && !context?.cookie) {
    return url;
  }

  const publicApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (!publicApiUrl || !url.startsWith(publicApiUrl)) {
    return url;
  }

  // SSR and server actions must bypass the public ingress. The in-cluster
  // app-ui proxy preserves the session-cookie-to-Bearer-token exchange used
  // by browser API calls. EOS_API_SERVER_URL should point at that proxy.
  const serverApiUrl =
    typeof process !== 'undefined'
      ? process.env['EOS_API_SERVER_URL']
      : undefined;

  if (!serverApiUrl) {
    return url;
  }

  return `${serverApiUrl}${url.slice(publicApiUrl.length)}`;
}

function buildFetchOptions(
  options: RequestInit,
  context?: RequestContext,
): RequestInit {
  const headers = new Headers(options.headers ?? {});
  const cookie = getCookieFromContext(context);
  const hasServerContext = Boolean(context?.request || context?.cookie);

  if (hasServerContext && !cookie) {
    throw new Error('Missing Cookie for server request context');
  }

  if (cookie) {
    headers.set('Cookie', cookie);
  }

  return {
    ...options,
    headers,
    credentials: cookie
      ? options.credentials
      : (options.credentials ?? 'include'),
  };
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  context?: RequestContext,
): Promise<Response> {
  const fetchOptions = buildFetchOptions(options, context);
  return fetch(resolveServerApiUrl(url, context), fetchOptions);
}

export async function apiFetchJson<T>(
  url: string,
  options: RequestInit = {},
  context?: RequestContext,
): Promise<T> {
  const requestBody = context?.requestBody ?? parseRequestBody(options.body);
  if (context?.requestSchema && requestBody !== undefined) {
    validateRequestSchema(context.requestSchema, requestBody, {
      url,
      schemaName: context.schemaName,
    });
  }

  const response = await apiFetch(url, options, context);

  // Check for HTTP errors
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as Error & {
      status?: number;
      response?: { data?: unknown };
    };
    error.status = response.status;
    try {
      error.response = { data: await response.clone().json() };
    } catch {
      error.response = { data: await response.clone().text() };
    }
    throw error;
  }

  const data = (await response.json()) as unknown;

  if (context?.responseSchema) {
    return validateResponseSchema(context.responseSchema, data, {
      url,
      schemaName: context.schemaName,
    }) as T;
  }

  return data as T;
}

type SchemaValidationMeta = {
  url: string;
  schemaName?: string;
};

function parseRequestBody(body?: BodyInit | null): unknown {
  if (!body) {
    return undefined;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function validateRequestSchema(
  schema: z.ZodTypeAny,
  data: unknown,
  meta: SchemaValidationMeta,
): unknown {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const summary = result.error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');

  const error = new Error(
    summary
      ? `Request schema mismatch (${summary})`
      : 'Request schema mismatch',
  ) as Error & {
    issues?: z.ZodIssue[];
    url?: string;
    schemaName?: string;
  };
  error.issues = result.error.issues;
  error.url = meta.url;
  error.schemaName = meta.schemaName;
  throw error;
}

export function validateResponseSchema(
  schema: z.ZodTypeAny,
  data: unknown,
  meta: SchemaValidationMeta,
): unknown {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const payload = {
    url: meta.url,
    schema: meta.schemaName,
    issues: result.error.issues,
    data,
  };

  console.warn('Response schema mismatch', payload);
  return data;
}
