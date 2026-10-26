import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  Automation,
  AutomationCreateRequest,
  AutomationListResponse,
  AutomationRunEventPageResponse,
  AutomationRunPageResponse,
  AutomationStatusRequest,
  AutomationTriggerCreatedResponse,
  AutomationTriggerCreateRequest,
  AutomationTriggerListResponse,
  AutomationTriggerUpdateRequest,
  AutomationUpdateRequest,
  ManualAutomationInvocationRequest,
  WebhookTriggerTokenResponse,
} from './automations.schemas';
import {
  automationCreateRequestSchema,
  automationListResponseSchema,
  automationRunEventPageResponseSchema,
  automationRunPageResponseSchema,
  automationStatusRequestSchema,
  automationTriggerCreatedResponseSchema,
  automationTriggerCreateRequestSchema,
  automationTriggerListResponseSchema,
  automationTriggerUpdateRequestSchema,
  automationUpdateRequestSchema,
  manualAutomationInvocationRequestSchema,
  webhookTriggerTokenResponseSchema,
} from './automations.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/automations`;

const organizationQuery = (organizationId: string, params = '') => {
  const query = new URLSearchParams({ organizationId });
  if (params) {
    new URLSearchParams(params).forEach((value, key) => query.set(key, value));
  }
  return `?${query.toString()}`;
};

export async function listAutomations(
  organizationId: string,
  agentId: string,
  context?: RequestContext,
): Promise<AutomationListResponse> {
  return apiFetchJson(
    `${baseUrl}${organizationQuery(organizationId, `agent_id=${agentId}`)}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: automationListResponseSchema,
      schemaName: 'AutomationListResponse',
    },
  );
}

export async function createAutomation(
  organizationId: string,
  payload: AutomationCreateRequest,
  context?: RequestContext,
): Promise<Automation> {
  validateRequestSchema(automationCreateRequestSchema, payload, {
    url: baseUrl,
    schemaName: 'AutomationCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}${organizationQuery(organizationId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: automationCreateRequestSchema,
      responseSchema: automationListResponseSchema.shape.data.element,
      schemaName: 'AutomationResponse',
      requestBody: payload,
    },
  );
}

export async function updateAutomation(
  organizationId: string,
  automationId: string,
  payload: AutomationUpdateRequest,
  context?: RequestContext,
): Promise<Automation> {
  validateRequestSchema(automationUpdateRequestSchema, payload, {
    url: `${baseUrl}/${automationId}`,
    schemaName: 'AutomationUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${automationId}${organizationQuery(organizationId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: automationUpdateRequestSchema,
      responseSchema: automationListResponseSchema.shape.data.element,
      schemaName: 'AutomationResponse',
      requestBody: payload,
    },
  );
}

export async function setAutomationStatus(
  organizationId: string,
  automationId: string,
  payload: AutomationStatusRequest,
  context?: RequestContext,
): Promise<Automation> {
  validateRequestSchema(automationStatusRequestSchema, payload, {
    url: `${baseUrl}/${automationId}/status`,
    schemaName: 'AutomationStatusRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${automationId}/status${organizationQuery(organizationId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: automationStatusRequestSchema,
      responseSchema: automationListResponseSchema.shape.data.element,
      schemaName: 'AutomationResponse',
      requestBody: payload,
    },
  );
}

export async function listAutomationTriggers(
  organizationId: string,
  automationId: string,
  context?: RequestContext,
): Promise<AutomationTriggerListResponse> {
  return apiFetchJson(
    `${baseUrl}/${automationId}/triggers${organizationQuery(organizationId)}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: automationTriggerListResponseSchema,
      schemaName: 'AutomationTriggerListResponse',
    },
  );
}

export async function createAutomationTrigger(
  organizationId: string,
  automationId: string,
  payload: AutomationTriggerCreateRequest,
  context?: RequestContext,
): Promise<AutomationTriggerCreatedResponse> {
  validateRequestSchema(automationTriggerCreateRequestSchema, payload, {
    url: `${baseUrl}/${automationId}/triggers`,
    schemaName: 'AutomationTriggerCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${automationId}/triggers${organizationQuery(organizationId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: automationTriggerCreateRequestSchema,
      responseSchema: automationTriggerCreatedResponseSchema,
      schemaName: 'AutomationTriggerCreatedResponse',
      requestBody: payload,
    },
  );
}

export async function updateAutomationTrigger(
  organizationId: string,
  automationId: string,
  triggerId: string,
  payload: AutomationTriggerUpdateRequest,
  context?: RequestContext,
): Promise<void> {
  validateRequestSchema(automationTriggerUpdateRequestSchema, payload, {
    url: `${baseUrl}/${automationId}/triggers/${triggerId}`,
    schemaName: 'AutomationTriggerUpdateRequest',
  });
  await apiFetchJson(
    `${baseUrl}/${automationId}/triggers/${triggerId}${organizationQuery(organizationId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: automationTriggerUpdateRequestSchema,
      requestBody: payload,
    },
  );
}

export async function getWebhookTriggerToken(
  organizationId: string,
  automationId: string,
  triggerId: string,
  context?: RequestContext,
): Promise<WebhookTriggerTokenResponse> {
  return apiFetchJson(
    `${baseUrl}/${automationId}/triggers/${triggerId}/webhook-token${organizationQuery(organizationId)}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: webhookTriggerTokenResponseSchema,
      schemaName: 'WebhookTriggerTokenResponse',
    },
  );
}

export async function listAutomationRuns(
  organizationId: string,
  agentId: string,
  { cursor, limit = 50, ...context }: RequestContext & {
    cursor?: string | null;
    limit?: number;
  } = {},
): Promise<AutomationRunPageResponse> {
  const params = new URLSearchParams({ agent_id: agentId, limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiFetchJson(
    `${baseUrl}/runs${organizationQuery(organizationId, params.toString())}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: automationRunPageResponseSchema,
      schemaName: 'AutomationRunPageResponse',
    },
  );
}

export async function listAutomationRunEvents(
  organizationId: string,
  runId: string,
  { afterId, limit = 100, ...context }: RequestContext & {
    afterId?: number | null;
    limit?: number;
  } = {},
): Promise<AutomationRunEventPageResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (afterId !== undefined && afterId !== null) {
    params.set('after_id', String(afterId));
  }
  return apiFetchJson(
    `${baseUrl}/runs/${runId}/events${organizationQuery(organizationId, params.toString())}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: automationRunEventPageResponseSchema,
      schemaName: 'AutomationRunEventPageResponse',
    },
  );
}

export async function invokeAutomationManually(
  organizationId: string,
  automationId: string,
  idempotencyKey: string,
  payload: ManualAutomationInvocationRequest = {},
  context?: RequestContext,
): Promise<AutomationRunPageResponse['data'][number]> {
  validateRequestSchema(manualAutomationInvocationRequestSchema, payload, {
    url: `${baseUrl}/${automationId}/runs`,
    schemaName: 'ManualAutomationInvocationRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${automationId}/runs${organizationQuery(organizationId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: manualAutomationInvocationRequestSchema,
      responseSchema: automationRunPageResponseSchema.shape.data.element,
      schemaName: 'AutomationRunResponse',
      requestBody: payload,
    },
  );
}
