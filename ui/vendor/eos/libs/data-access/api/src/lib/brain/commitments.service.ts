import {
  apiFetchJson,
  type RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type { z } from 'zod';
import {
  commitmentCategoryCreateRequestSchema,
  commitmentCategoryListSchema,
  commitmentCategorySchema,
  commitmentCategoryUpdateRequestSchema,
  commitmentCreateRequestSchema,
  commitmentListSchema,
  commitmentSchema,
  commitmentStatusRequestSchema,
  commitmentUpdateRequestSchema,
  type Commitment,
  type CommitmentCategory,
  type CommitmentCategoryCreateRequest,
  type CommitmentCategoryUpdateRequest,
  type CommitmentCreateRequest,
  type CommitmentList,
  type CommitmentStatus,
  type CommitmentStatusRequest,
  type CommitmentUpdateRequest,
} from './commitments.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/brain`;

export interface CommitmentListFilters {
  workspaceId?: string;
  initiativeId?: string;
  categoryId?: string;
  withoutInitiative?: boolean;
  ownerIdentityId?: string;
  mine?: boolean;
  statuses?: CommitmentStatus[];
  limit?: number;
}

export const commitmentsQueryKey = (
  organizationId: string,
  filters: CommitmentListFilters = {},
) => ['brain-commitments', organizationId, filters] as const;

export const commitmentsRootQueryKey = (organizationId: string) =>
  ['brain-commitments', organizationId] as const;

export const commitmentCategoriesQueryKey = (
  organizationId: string,
  includeArchived = false,
) => ['brain-commitment-categories', organizationId, includeArchived] as const;

function sendJson(
  url: string,
  method: 'POST' | 'PATCH',
  payload: unknown,
  requestSchema: z.ZodTypeAny,
  schemaName: string,
) {
  validateRequestSchema(requestSchema, payload, { url, schemaName });
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

export async function listCommitments(
  organizationId: string,
  filters: CommitmentListFilters = {},
  context?: RequestContext,
): Promise<CommitmentList> {
  const params = new URLSearchParams({ organizationId });
  if (filters.workspaceId) params.set('workspace_id', filters.workspaceId);
  if (filters.initiativeId) params.set('initiative_id', filters.initiativeId);
  if (filters.categoryId) params.set('category_id', filters.categoryId);
  if (filters.withoutInitiative) params.set('without_initiative', 'true');
  if (filters.ownerIdentityId) {
    params.set('owner_identity_id', filters.ownerIdentityId);
  }
  if (filters.mine) params.set('mine', 'true');
  for (const status of filters.statuses ?? []) params.append('status', status);
  if (filters.limit) params.set('limit', String(filters.limit));
  return apiFetchJson(
    `${baseUrl}/commitments?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: commitmentListSchema },
  );
}

export async function createCommitment(
  organizationId: string,
  payload: CommitmentCreateRequest,
  context?: RequestContext,
): Promise<Commitment> {
  const url = `${baseUrl}/commitments?organizationId=${organizationId}`;
  return apiFetchJson(
    url,
    sendJson(
      url,
      'POST',
      payload,
      commitmentCreateRequestSchema,
      'CommitmentCreateRequest',
    ),
    { ...context, responseSchema: commitmentSchema },
  );
}

export async function updateCommitment(
  organizationId: string,
  commitmentId: string,
  payload: CommitmentUpdateRequest,
  context?: RequestContext,
): Promise<Commitment> {
  const url = `${baseUrl}/commitments/${commitmentId}?organizationId=${organizationId}`;
  return apiFetchJson(
    url,
    sendJson(
      url,
      'PATCH',
      payload,
      commitmentUpdateRequestSchema,
      'CommitmentUpdateRequest',
    ),
    { ...context, responseSchema: commitmentSchema },
  );
}

export async function changeCommitmentStatus(
  organizationId: string,
  commitmentId: string,
  payload: CommitmentStatusRequest,
  context?: RequestContext,
): Promise<Commitment> {
  const url = `${baseUrl}/commitments/${commitmentId}/status?organizationId=${organizationId}`;
  return apiFetchJson(
    url,
    sendJson(
      url,
      'POST',
      payload,
      commitmentStatusRequestSchema,
      'CommitmentStatusRequest',
    ),
    { ...context, responseSchema: commitmentSchema },
  );
}

export async function listCommitmentCategories(
  organizationId: string,
  options: { includeArchived?: boolean } = {},
  context?: RequestContext,
): Promise<CommitmentCategory[]> {
  const params = new URLSearchParams({ organizationId });
  if (options.includeArchived) params.set('include_archived', 'true');
  const result = await apiFetchJson<{ data: CommitmentCategory[] }>(
    `${baseUrl}/commitment-categories?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: commitmentCategoryListSchema },
  );
  return result.data;
}

export async function createCommitmentCategory(
  organizationId: string,
  payload: CommitmentCategoryCreateRequest,
  context?: RequestContext,
): Promise<CommitmentCategory> {
  const url = `${baseUrl}/commitment-categories?organizationId=${organizationId}`;
  return apiFetchJson(
    url,
    sendJson(
      url,
      'POST',
      payload,
      commitmentCategoryCreateRequestSchema,
      'CommitmentCategoryCreateRequest',
    ),
    { ...context, responseSchema: commitmentCategorySchema },
  );
}

export async function updateCommitmentCategory(
  organizationId: string,
  categoryId: string,
  payload: CommitmentCategoryUpdateRequest,
  context?: RequestContext,
): Promise<CommitmentCategory> {
  const url = `${baseUrl}/commitment-categories/${categoryId}?organizationId=${organizationId}`;
  return apiFetchJson(
    url,
    sendJson(
      url,
      'PATCH',
      payload,
      commitmentCategoryUpdateRequestSchema,
      'CommitmentCategoryUpdateRequest',
    ),
    { ...context, responseSchema: commitmentCategorySchema },
  );
}
