import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  initiativeCreateRequestSchema,
  initiativeGenerationResponseSchema,
  initiativeListResponseSchema,
  initiativeSchema,
  initiativeUpdateRequestSchema,
  type Initiative,
  type InitiativeCreateRequest,
  type InitiativeGenerationResponse,
  type InitiativeListResponse,
  type InitiativeUpdateRequest,
} from './initiatives.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/initiatives`;

export async function generateInitiativeBrief(
  organizationId: string,
  goal: string,
  context?: RequestContext,
): Promise<InitiativeGenerationResponse> {
  return apiFetchJson(
    `${baseUrl}/generate?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal }),
    },
    {
      ...context,
      responseSchema: initiativeGenerationResponseSchema,
      schemaName: 'InitiativeGenerationResponse',
    },
  );
}

export async function listInitiatives(
  organizationId: string,
  context?: RequestContext,
  workspaceId?: string,
): Promise<InitiativeListResponse> {
  const params = new URLSearchParams({ organizationId });
  if (workspaceId) params.set('workspace_id', workspaceId);
  return apiFetchJson(`${baseUrl}?${params.toString()}`, { method: 'GET' }, {
    ...context,
    responseSchema: initiativeListResponseSchema,
    schemaName: 'InitiativeListResponse',
  });
}

export async function getInitiative(
  organizationId: string,
  initiativeId: string,
  context?: RequestContext,
): Promise<Initiative> {
  return apiFetchJson(
    `${baseUrl}/${initiativeId}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: initiativeSchema,
      schemaName: 'InitiativeResponse',
    },
  );
}

export async function createInitiative(
  organizationId: string,
  payload: InitiativeCreateRequest,
  context?: RequestContext,
): Promise<Initiative> {
  validateRequestSchema(initiativeCreateRequestSchema, payload, {
    url: `${baseUrl}?organizationId=${organizationId}`,
    schemaName: 'InitiativeCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: initiativeSchema,
      schemaName: 'InitiativeResponse',
    },
  );
}

export async function updateInitiative(
  organizationId: string,
  initiativeId: string,
  payload: InitiativeUpdateRequest,
  context?: RequestContext,
): Promise<Initiative> {
  validateRequestSchema(initiativeUpdateRequestSchema, payload, {
    url: `${baseUrl}/${initiativeId}?organizationId=${organizationId}`,
    schemaName: 'InitiativeUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${initiativeId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: initiativeSchema,
      schemaName: 'InitiativeResponse',
    },
  );
}
