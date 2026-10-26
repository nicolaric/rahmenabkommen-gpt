import {
  apiFetchJson,
  type RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  researchPackCreateRequestSchema,
  researchPackListSchema,
  researchPackSchema,
  researchPackUpdateRequestSchema,
  researchRunListSchema,
  researchRunSchema,
  researchSuggestionRequestSchema,
  researchSuggestionSchema,
  type ResearchPack,
  type ResearchPackCreateRequest,
  type ResearchPackList,
  type ResearchPackUpdateRequest,
  type ResearchRun,
  type ResearchSuggestion,
  type ResearchSuggestionRequest,
} from './research.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/research`;

export async function createResearchPack(
  organizationId: string,
  payload: ResearchPackCreateRequest,
  context?: RequestContext,
): Promise<ResearchPack> {
  validateRequestSchema(researchPackCreateRequestSchema, payload, {
    url: `${baseUrl}/packs?organizationId=${organizationId}`,
    schemaName: 'ResearchPackCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/packs?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: researchPackSchema,
      schemaName: 'ResearchPackResponse',
    },
  );
}

export async function listResearchPacks(
  organizationId: string,
  workspaceId?: string,
  context?: RequestContext,
): Promise<ResearchPackList> {
  const params = new URLSearchParams({ organizationId });
  if (workspaceId) params.set('workspace_id', workspaceId);
  return apiFetchJson(
    `${baseUrl}/packs?${params.toString()}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: researchPackListSchema,
      schemaName: 'ResearchPackListResponse',
    },
  );
}

export async function getResearchPack(
  organizationId: string,
  packId: string,
  context?: RequestContext,
): Promise<ResearchPack> {
  return apiFetchJson(
    `${baseUrl}/packs/${packId}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: researchPackSchema,
      schemaName: 'ResearchPackResponse',
    },
  );
}

export async function updateResearchPack(
  organizationId: string,
  packId: string,
  payload: ResearchPackUpdateRequest,
  context?: RequestContext,
): Promise<ResearchPack> {
  validateRequestSchema(researchPackUpdateRequestSchema, payload, {
    url: `${baseUrl}/packs/${packId}?organizationId=${organizationId}`,
    schemaName: 'ResearchPackUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/packs/${packId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: researchPackSchema,
      schemaName: 'ResearchPackResponse',
    },
  );
}

export async function listResearchRuns(
  organizationId: string,
  packId: string,
  context?: RequestContext,
): Promise<ResearchRun[]> {
  const response = await apiFetchJson<{ data: ResearchRun[]; count: number }>(
    `${baseUrl}/packs/${packId}/runs?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: researchRunListSchema,
      schemaName: 'ResearchRunListResponse',
    },
  );
  return response.data;
}

export async function getResearchRun(
  organizationId: string,
  packId: string,
  runId: string,
  context?: RequestContext,
): Promise<ResearchRun> {
  return apiFetchJson(
    `${baseUrl}/packs/${packId}/runs/${runId}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: researchRunSchema,
      schemaName: 'ResearchRunDetailResponse',
    },
  );
}

export async function retryResearchRun(
  organizationId: string,
  packId: string,
  runId: string,
  context?: RequestContext,
): Promise<ResearchRun> {
  return apiFetchJson(
    `${baseUrl}/packs/${packId}/runs/${runId}/retry?organizationId=${organizationId}`,
    { method: 'POST' },
    {
      ...context,
      responseSchema: researchRunSchema,
      schemaName: 'ResearchRunDetailResponse',
    },
  );
}

export async function suggestResearch(
  organizationId: string,
  payload: ResearchSuggestionRequest,
  context?: RequestContext,
): Promise<ResearchSuggestion> {
  validateRequestSchema(researchSuggestionRequestSchema, payload, {
    url: `${baseUrl}/suggestions?organizationId=${organizationId}`,
    schemaName: 'ResearchSuggestionRequest',
  });
  return apiFetchJson(
    `${baseUrl}/suggestions?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: researchSuggestionSchema,
      schemaName: 'ResearchSuggestionResponse',
    },
  );
}
