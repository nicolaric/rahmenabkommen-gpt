import {
  apiFetchJson,
  type RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  deliverableEvaluationRequestSchema,
  deliverableEvaluationSchema,
  deliverableMeasurementIntentRequestSchema,
  deliverableOutcomeScorecardSchema,
  deliverableReleaseSchema,
  projectDeliverableCreateRequestSchema,
  projectDeliverableListSchema,
  projectDeliverableRevisionCreateRequestSchema,
  projectDeliverableRevisionSchema,
  projectDeliverableSchema,
  type DeliverableEvaluation,
  type DeliverableMeasurementIntentRequest,
  type DeliverableOutcomeScorecard,
  type DeliverableRelease,
  type DeliverableEvaluationRequest,
  type ProjectDeliverable,
  type ProjectDeliverableCreateRequest,
  type ProjectDeliverableList,
  type ProjectDeliverableRevision,
  type ProjectDeliverableRevisionCreateRequest,
  strategyFollowUpAnswerRequestSchema,
  strategyFollowUpSchema,
  strategyFollowUpStatusRequestSchema,
  type StrategyFollowUp,
} from './deliverables.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/project-deliverables`;

export const projectDeliverablesQueryKey = (
  organizationId: string,
  workspaceId?: string,
) => ['project-deliverables', organizationId, workspaceId] as const;

export const projectDeliverableQueryKey = (
  organizationId: string,
  deliverableId: string,
) => ['project-deliverable', organizationId, deliverableId] as const;

export const projectDeliverableRevisionsQueryKey = (
  organizationId: string,
  deliverableId: string,
) => ['project-deliverable-revisions', organizationId, deliverableId] as const;

export const strategyFollowUpsQueryKey = (
  organizationId: string,
  deliverableId: string,
) => ['strategy-follow-ups', organizationId, deliverableId] as const;

export const deliverableReleasesQueryKey = (
  organizationId: string,
  deliverableId: string,
) => ['deliverable-releases', organizationId, deliverableId] as const;

export const deliverableEvaluationsQueryKey = (
  organizationId: string,
  deliverableId: string,
) => ['deliverable-evaluations', organizationId, deliverableId] as const;

export const deliverableOutcomeScorecardsQueryKey = (
  organizationId: string,
  deliverableId: string,
  revisionId?: string,
) =>
  [
    'deliverable-outcome-scorecards',
    organizationId,
    deliverableId,
    revisionId,
  ] as const;

export async function createProjectDeliverable(
  organizationId: string,
  payload: ProjectDeliverableCreateRequest,
  context?: RequestContext,
): Promise<ProjectDeliverable> {
  const url = `${baseUrl}?organizationId=${organizationId}`;
  validateRequestSchema(projectDeliverableCreateRequestSchema, payload, {
    url,
    schemaName: 'ProjectDeliverableCreateRequest',
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
      responseSchema: projectDeliverableSchema,
      schemaName: 'ProjectDeliverableResponse',
    },
  );
}

export async function listProjectDeliverables(
  organizationId: string,
  workspaceId?: string,
  context?: RequestContext,
): Promise<ProjectDeliverableList> {
  const params = new URLSearchParams({ organizationId });
  if (workspaceId) params.set('workspace_id', workspaceId);
  return apiFetchJson(
    `${baseUrl}?${params.toString()}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: projectDeliverableListSchema,
      schemaName: 'ProjectDeliverableListResponse',
    },
  );
}

export async function getProjectDeliverable(
  organizationId: string,
  deliverableId: string,
  context?: RequestContext,
): Promise<ProjectDeliverable> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: projectDeliverableSchema,
      schemaName: 'ProjectDeliverableResponse',
    },
  );
}

export async function generateProjectDeliverable(
  organizationId: string,
  deliverableId: string,
  context?: RequestContext,
): Promise<ProjectDeliverable> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/generate?organizationId=${organizationId}`,
    { method: 'POST' },
    {
      ...context,
      responseSchema: projectDeliverableSchema,
      schemaName: 'ProjectDeliverableResponse',
    },
  );
}

export async function listProjectDeliverableRevisions(
  organizationId: string,
  deliverableId: string,
  context?: RequestContext,
): Promise<ProjectDeliverableRevision[]> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/revisions?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: projectDeliverableRevisionSchema.array(),
      schemaName: 'ProjectDeliverableRevisionListResponse',
    },
  );
}

export async function listStrategyFollowUps(
  organizationId: string,
  deliverableId: string,
  context?: RequestContext,
): Promise<StrategyFollowUp[]> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/follow-ups?organizationId=${organizationId}`,
    { method: 'GET' },
    { ...context, responseSchema: strategyFollowUpSchema.array() },
  );
}

export async function answerStrategyFollowUp(
  organizationId: string,
  deliverableId: string,
  questionId: string,
  payload: { answer?: string; document_id?: string },
  context?: RequestContext,
): Promise<StrategyFollowUp> {
  const url = `${baseUrl}/${deliverableId}/follow-ups/${questionId}/answer?organizationId=${organizationId}`;
  validateRequestSchema(strategyFollowUpAnswerRequestSchema, payload, {
    url,
    schemaName: 'StrategyFollowUpAnswerRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: strategyFollowUpSchema },
  );
}

export async function updateStrategyFollowUpStatus(
  organizationId: string,
  deliverableId: string,
  questionId: string,
  status: 'deferred' | 'dismissed',
  context?: RequestContext,
): Promise<StrategyFollowUp> {
  const url = `${baseUrl}/${deliverableId}/follow-ups/${questionId}?organizationId=${organizationId}`;
  const payload = { status };
  validateRequestSchema(strategyFollowUpStatusRequestSchema, payload, {
    url,
    schemaName: 'StrategyFollowUpStatusRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: strategyFollowUpSchema },
  );
}

export async function releaseDeliverable(
  organizationId: string,
  deliverableId: string,
  context?: RequestContext,
): Promise<DeliverableRelease> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/release?organizationId=${organizationId}`,
    { method: 'POST' },
    { ...context, responseSchema: deliverableReleaseSchema },
  );
}

export async function listDeliverableReleases(
  organizationId: string,
  deliverableId: string,
  context?: RequestContext,
): Promise<DeliverableRelease[]> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/releases?organizationId=${organizationId}`,
    { method: 'GET' },
    { ...context, responseSchema: deliverableReleaseSchema.array() },
  );
}

export async function requestDeliverableEvaluation(
  organizationId: string,
  deliverableId: string,
  payload: DeliverableEvaluationRequest = {},
  context?: RequestContext,
): Promise<DeliverableEvaluation> {
  const url = `${baseUrl}/${deliverableId}/evaluations?organizationId=${organizationId}`;
  validateRequestSchema(deliverableEvaluationRequestSchema, payload, {
    url,
    schemaName: 'DeliverableEvaluationRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: deliverableEvaluationSchema },
  );
}

export async function listDeliverableEvaluations(
  organizationId: string,
  deliverableId: string,
  context?: RequestContext,
): Promise<DeliverableEvaluation[]> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/evaluations?organizationId=${organizationId}`,
    { method: 'GET' },
    { ...context, responseSchema: deliverableEvaluationSchema.array() },
  );
}

export async function retryDeliverableEvaluation(
  organizationId: string,
  deliverableId: string,
  evaluationId: string,
  context?: RequestContext,
): Promise<DeliverableEvaluation> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/evaluations/${evaluationId}/retry?organizationId=${organizationId}`,
    { method: 'POST' },
    { ...context, responseSchema: deliverableEvaluationSchema },
  );
}

export async function createDeliverableMeasurementIntent(
  organizationId: string,
  deliverableId: string,
  payload: DeliverableMeasurementIntentRequest,
  context?: RequestContext,
): Promise<DeliverableOutcomeScorecard> {
  const url = `${baseUrl}/${deliverableId}/outcomes?organizationId=${organizationId}`;
  validateRequestSchema(deliverableMeasurementIntentRequestSchema, payload, {
    url,
    schemaName: 'DeliverableMeasurementIntentRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: deliverableOutcomeScorecardSchema },
  );
}

export async function refreshDeliverableOutcomeScorecard(
  organizationId: string,
  deliverableId: string,
  measurementIntentId: string,
  context?: RequestContext,
): Promise<DeliverableOutcomeScorecard> {
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/outcomes/${measurementIntentId}/refresh?organizationId=${organizationId}`,
    { method: 'POST' },
    { ...context, responseSchema: deliverableOutcomeScorecardSchema },
  );
}

export async function listDeliverableOutcomeScorecards(
  organizationId: string,
  deliverableId: string,
  revisionId?: string,
  context?: RequestContext,
): Promise<DeliverableOutcomeScorecard[]> {
  const params = new URLSearchParams({ organizationId });
  if (revisionId) params.set('revision_id', revisionId);
  return apiFetchJson(
    `${baseUrl}/${deliverableId}/outcomes?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: deliverableOutcomeScorecardSchema.array() },
  );
}

export async function createProjectDeliverableRevision(
  organizationId: string,
  deliverableId: string,
  payload: ProjectDeliverableRevisionCreateRequest,
  context?: RequestContext,
): Promise<ProjectDeliverableRevision> {
  const url = `${baseUrl}/${deliverableId}/revisions?organizationId=${organizationId}`;
  validateRequestSchema(
    projectDeliverableRevisionCreateRequestSchema,
    payload,
    {
      url,
      schemaName: 'ProjectDeliverableRevisionCreateRequest',
    },
  );
  return apiFetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: projectDeliverableRevisionSchema,
      schemaName: 'ProjectDeliverableRevisionResponse',
    },
  );
}
