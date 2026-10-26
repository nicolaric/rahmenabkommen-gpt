import {
  apiFetch,
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyListResponse,
  ApiKey,
} from './api-keys.schemas';
import {
  apiKeyCreateRequestSchema,
  apiKeyCreateResponseSchema,
  apiKeyListResponseSchema,
  apiKeySchema,
} from './api-keys.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/api-keys`;

export async function listApiKeys(
  organizationId: string,
  context?: RequestContext,
): Promise<ApiKeyListResponse> {
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    {
      method: 'GET',
    },
    {
      ...context,
      responseSchema: apiKeyListResponseSchema,
      schemaName: 'ApiKeyListResponse',
    },
  );
}

export async function createApiKey(
  organizationId: string,
  payload: ApiKeyCreateRequest,
  context?: RequestContext,
): Promise<ApiKeyCreateResponse> {
  validateRequestSchema(apiKeyCreateRequestSchema, payload, {
    url: baseUrl,
    schemaName: 'ApiKeyCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: apiKeyCreateRequestSchema,
      responseSchema: apiKeyCreateResponseSchema,
      schemaName: 'ApiKeyCreateResponse',
      requestBody: payload,
    },
  );
}

export async function revokeApiKey(
  organizationId: string,
  apiKeyId: string,
  context?: RequestContext,
): Promise<ApiKey> {
  return apiFetchJson(
    `${baseUrl}/${apiKeyId}?organizationId=${organizationId}`,
    {
      method: 'DELETE',
    },
    {
      ...context,
      responseSchema: apiKeySchema,
      schemaName: 'ApiKeyResponse',
    },
  );
}
