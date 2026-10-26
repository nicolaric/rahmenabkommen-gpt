import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  organizationContextCreateRequestSchema,
  organizationContextEntrySchema,
  organizationContextListResponseSchema,
  organizationContextUpdateRequestSchema,
  type OrganizationContextCreateRequest,
  type OrganizationContextEntry,
  type OrganizationContextListOptions,
  type OrganizationContextListResponse,
  type OrganizationContextUpdateRequest,
} from './organization-context.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/organization-context`;

export const organizationContextQueryKeys = {
  all: (organizationId: string) => ['organization-context', organizationId] as const,
  list: (
    organizationId: string,
    options?: OrganizationContextListOptions,
  ) => [...organizationContextQueryKeys.all(organizationId), 'list', options ?? {}] as const,
  detail: (organizationId: string, entryId: string) =>
    [...organizationContextQueryKeys.all(organizationId), 'detail', entryId] as const,
};

function buildListUrl(
  organizationId: string,
  options?: OrganizationContextListOptions,
): string {
  const params = new URLSearchParams({ organizationId });
  if (options?.workspaceId) params.set('workspace_id', options.workspaceId);
  if (options?.kind) params.set('kind', options.kind);
  if (options?.status) params.set('status', options.status);
  if (options?.search) params.set('search', options.search);
  return `${baseUrl}?${params.toString()}`;
}

export async function listOrganizationContext(
  organizationId: string,
  options?: OrganizationContextListOptions,
  context?: RequestContext,
): Promise<OrganizationContextListResponse> {
  return apiFetchJson(buildListUrl(organizationId, options), { method: 'GET' }, {
    ...context,
    responseSchema: organizationContextListResponseSchema,
    schemaName: 'OrganizationContextListResponse',
  });
}

export async function getOrganizationContextEntry(
  organizationId: string,
  entryId: string,
  context?: RequestContext,
): Promise<OrganizationContextEntry> {
  return apiFetchJson(
    `${baseUrl}/${entryId}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: organizationContextEntrySchema,
      schemaName: 'OrganizationContextResponse',
    },
  );
}

export async function createOrganizationContextEntry(
  organizationId: string,
  payload: OrganizationContextCreateRequest,
  context?: RequestContext,
): Promise<OrganizationContextEntry> {
  const url = `${baseUrl}?organizationId=${organizationId}`;
  validateRequestSchema(organizationContextCreateRequestSchema, payload, {
    url,
    schemaName: 'OrganizationContextCreateRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: organizationContextEntrySchema,
      schemaName: 'OrganizationContextResponse',
    },
  );
}

export async function updateOrganizationContextEntry(
  organizationId: string,
  entryId: string,
  payload: OrganizationContextUpdateRequest,
  context?: RequestContext,
): Promise<OrganizationContextEntry> {
  const url = `${baseUrl}/${entryId}?organizationId=${organizationId}`;
  validateRequestSchema(organizationContextUpdateRequestSchema, payload, {
    url,
    schemaName: 'OrganizationContextUpdateRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: organizationContextEntrySchema,
      schemaName: 'OrganizationContextResponse',
    },
  );
}

export async function archiveOrganizationContextEntry(
  organizationId: string,
  entryId: string,
  context?: RequestContext,
): Promise<OrganizationContextEntry> {
  return apiFetchJson(
    `${baseUrl}/${entryId}/archive?organizationId=${organizationId}`,
    { method: 'POST' },
    {
      ...context,
      responseSchema: organizationContextEntrySchema,
      schemaName: 'OrganizationContextResponse',
    },
  );
}

export async function restoreOrganizationContextEntry(
  organizationId: string,
  entryId: string,
  context?: RequestContext,
): Promise<OrganizationContextEntry> {
  return updateOrganizationContextEntry(
    organizationId,
    entryId,
    { status: 'active' },
    context,
  );
}

export function invalidateOrganizationContextKeys(organizationId: string) {
  return [organizationContextQueryKeys.all(organizationId)];
}
