import {
  apiFetchJson,
  type RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  brainDocumentEvidenceSchema,
  brainHealthLifecycleRequestSchema,
  brainImpactMaintenanceRequestSchema,
  brainImpactSchema,
  brainHealthOverviewSchema,
  brainHealthRefreshResponseSchema,
  brainMaintenanceRequestSchema,
  brainOverviewSchema,
  brainRetrievalAttemptSchema,
  brainTimelineSchema,
  knowledgeGapAttentionSchema,
  knowledgeGapContributionRequestSchema,
  knowledgeGapContributionSchema,
  knowledgeGapDetailSchema,
  knowledgeGapInvestigationSchema,
  knowledgeGapTriageRequestSchema,
  type BrainDocumentEvidence,
  type BrainHealthFinding,
  type BrainImpact,
  type BrainImpactMaintenanceRequest,
  type BrainHealthLifecycleRequest,
  type BrainHealthOverview,
  type BrainHealthRefreshResponse,
  type BrainMaintenanceRequest,
  type BrainOverview,
  type BrainRetrievalAttempt,
  type BrainTimeline,
  type KnowledgeGapAttention,
  type KnowledgeGapContribution,
  type KnowledgeGapContributionRequest,
  type KnowledgeGapDetail,
  type KnowledgeGapInvestigation,
  type KnowledgeGapTriageRequest,
} from './brain.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/brain`;

export const brainOverviewQueryKey = (
  organizationId: string,
  workspaceId?: string,
) => ['brain-overview', organizationId, workspaceId] as const;

export async function getBrainOverview(
  organizationId: string,
  options: {
    workspaceId?: string;
    itemType?: string;
    status?: string;
    attentionOnly?: boolean;
    limit?: number;
  } = {},
  context?: RequestContext,
): Promise<BrainOverview> {
  const params = new URLSearchParams({ organizationId });
  if (options.workspaceId) params.set('workspace_id', options.workspaceId);
  if (options.itemType) params.set('item_type', options.itemType);
  if (options.status) params.set('status', options.status);
  if (options.attentionOnly) params.set('attention_only', 'true');
  if (options.limit) params.set('limit', String(options.limit));
  return apiFetchJson(
    `${baseUrl}/overview?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: brainOverviewSchema },
  );
}

export const brainHealthQueryKey = (
  organizationId: string,
  workspaceId?: string,
) => ['brain-health', organizationId, workspaceId] as const;

export async function listBrainImpacts(
  organizationId: string,
  options: {
    workspaceId?: string;
    sourceSignalId?: string;
    targetType?: string;
    targetId?: string;
    limit?: number;
  } = {},
  context?: RequestContext,
): Promise<BrainImpact[]> {
  const params = new URLSearchParams({ organizationId });
  if (options.workspaceId) params.set('workspace_id', options.workspaceId);
  if (options.sourceSignalId)
    params.set('source_signal_id', options.sourceSignalId);
  if (options.targetType) params.set('target_type', options.targetType);
  if (options.targetId) params.set('target_id', options.targetId);
  if (options.limit) params.set('limit', String(options.limit));
  return apiFetchJson(
    `${baseUrl}/impact-relationships?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: brainImpactSchema.array() },
  );
}

export async function maintainBrainImpact(
  organizationId: string,
  impactId: string,
  payload: BrainImpactMaintenanceRequest,
  context?: RequestContext,
): Promise<BrainImpact> {
  const url = `${baseUrl}/impact-relationships/${impactId}?organizationId=${organizationId}`;
  validateRequestSchema(brainImpactMaintenanceRequestSchema, payload, {
    url,
    schemaName: 'BrainImpactMaintenanceRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: brainImpactSchema },
  );
}

export async function getBrainHealthOverview(
  organizationId: string,
  options: {
    workspaceId?: string;
    category?: string;
    severity?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  } = {},
  context?: RequestContext,
): Promise<BrainHealthOverview> {
  const params = new URLSearchParams({ organizationId });
  if (options.workspaceId) params.set('workspace_id', options.workspaceId);
  if (options.category) params.set('category', options.category);
  if (options.severity) params.set('severity', options.severity);
  if (options.status) params.set('status', options.status);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);
  return apiFetchJson(
    `${baseUrl}/health?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: brainHealthOverviewSchema },
  );
}

export async function refreshBrainHealth(
  organizationId: string,
  payload: { request_key?: string | null } = {},
  workspaceId?: string,
  context?: RequestContext,
): Promise<BrainHealthRefreshResponse> {
  const params = new URLSearchParams({ organizationId });
  if (workspaceId) params.set('workspace_id', workspaceId);
  return apiFetchJson(
    `${baseUrl}/health/refresh?${params.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: brainHealthRefreshResponseSchema },
  );
}

export async function getBrainHealthFinding(
  organizationId: string,
  findingId: string,
  context?: RequestContext,
): Promise<BrainHealthFinding> {
  return apiFetchJson(
    `${baseUrl}/health/findings/${findingId}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: brainHealthOverviewSchema.shape.findings.element,
    },
  );
}

export async function updateBrainHealthFinding(
  organizationId: string,
  findingId: string,
  payload: BrainHealthLifecycleRequest,
  context?: RequestContext,
): Promise<BrainHealthFinding> {
  const url = `${baseUrl}/health/findings/${findingId}?organizationId=${organizationId}`;
  validateRequestSchema(brainHealthLifecycleRequestSchema, payload, {
    url,
    schemaName: 'BrainHealthLifecycleRequest',
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
      responseSchema: brainHealthOverviewSchema.shape.findings.element,
    },
  );
}

export async function getBrainItemTimeline(
  organizationId: string,
  itemType: string,
  itemId: string,
  workspaceId?: string,
  context?: RequestContext,
): Promise<BrainTimeline> {
  const params = new URLSearchParams({ organizationId });
  if (workspaceId) params.set('workspace_id', workspaceId);
  return apiFetchJson(
    `${baseUrl}/items/${itemType}/${itemId}/timeline?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: brainTimelineSchema },
  );
}

export async function listBrainDocumentEvidence(
  organizationId: string,
  options: { workspaceId?: string; signalId?: string } = {},
  context?: RequestContext,
): Promise<BrainDocumentEvidence[]> {
  const params = new URLSearchParams({ organizationId });
  if (options.workspaceId) params.set('workspace_id', options.workspaceId);
  if (options.signalId) params.set('signal_id', options.signalId);
  return apiFetchJson(
    `${baseUrl}/document-evidence?${params.toString()}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: brainDocumentEvidenceSchema.array(),
    },
  );
}

export async function getBrainDocumentEvidence(
  organizationId: string,
  snapshotId: string,
  context?: RequestContext,
): Promise<BrainDocumentEvidence> {
  return apiFetchJson(
    `${baseUrl}/document-evidence/${snapshotId}?organizationId=${organizationId}`,
    { method: 'GET' },
    { ...context, responseSchema: brainDocumentEvidenceSchema },
  );
}

export async function retryBrainDocumentRetrieval(
  organizationId: string,
  signalId: string,
  context?: RequestContext,
): Promise<BrainRetrievalAttempt> {
  return apiFetchJson(
    `${baseUrl}/retrieval/${signalId}/retry?organizationId=${organizationId}`,
    { method: 'POST' },
    { ...context, responseSchema: brainRetrievalAttemptSchema },
  );
}

export const knowledgeGapAttentionQueryKey = (
  organizationId: string,
  workspaceId?: string,
) => ['brain-knowledge-gap-attention', organizationId, workspaceId] as const;

export const knowledgeGapDetailQueryKey = (
  organizationId: string,
  gapId: string,
) => ['brain-knowledge-gap', organizationId, gapId] as const;

export async function listKnowledgeGapAttention(
  organizationId: string,
  workspaceId?: string,
  context?: RequestContext,
): Promise<KnowledgeGapAttention> {
  const params = new URLSearchParams({ organizationId });
  if (workspaceId) params.set('workspace_id', workspaceId);
  return apiFetchJson(
    `${baseUrl}/knowledge-gaps/attention?${params}`,
    { method: 'GET' },
    { ...context, responseSchema: knowledgeGapAttentionSchema },
  );
}

export async function getKnowledgeGapDetail(
  organizationId: string,
  gapId: string,
  context?: RequestContext,
): Promise<KnowledgeGapDetail> {
  return apiFetchJson(
    `${baseUrl}/knowledge-gaps/${gapId}?organizationId=${organizationId}`,
    { method: 'GET' },
    { ...context, responseSchema: knowledgeGapDetailSchema },
  );
}

export async function triageKnowledgeGap(
  organizationId: string,
  gapId: string,
  payload: KnowledgeGapTriageRequest,
  context?: RequestContext,
): Promise<unknown> {
  const url = `${baseUrl}/knowledge-gaps/${gapId}/triage?organizationId=${organizationId}`;
  validateRequestSchema(knowledgeGapTriageRequestSchema, payload, {
    url,
    schemaName: 'KnowledgeGapTriageRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    context,
  );
}

export async function createKnowledgeGapInvestigation(
  organizationId: string,
  gapId: string,
  context?: RequestContext,
): Promise<KnowledgeGapInvestigation> {
  return apiFetchJson(
    `${baseUrl}/knowledge-gaps/${gapId}/investigations?organizationId=${organizationId}`,
    { method: 'POST' },
    { ...context, responseSchema: knowledgeGapInvestigationSchema },
  );
}

export async function createKnowledgeGapContribution(
  organizationId: string,
  gapId: string,
  payload: KnowledgeGapContributionRequest,
  context?: RequestContext,
): Promise<KnowledgeGapContribution> {
  const url = `${baseUrl}/knowledge-gaps/${gapId}/contributions?organizationId=${organizationId}`;
  validateRequestSchema(knowledgeGapContributionRequestSchema, payload, {
    url,
    schemaName: 'KnowledgeGapContributionRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: knowledgeGapContributionSchema },
  );
}

export async function updateBrainKnowledgeGap(
  organizationId: string,
  gapId: string,
  payload: BrainMaintenanceRequest,
  context?: RequestContext,
) {
  const url = `${baseUrl}/knowledge-gaps/${gapId}?organizationId=${organizationId}`;
  validateRequestSchema(brainMaintenanceRequestSchema, payload, {
    url,
    schemaName: 'BrainMaintenanceRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context },
  );
}
