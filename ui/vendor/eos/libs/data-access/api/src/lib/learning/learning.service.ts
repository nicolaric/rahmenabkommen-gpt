import {
  apiFetchJson,
  type RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  conversationSignalLinkRequestSchema,
  conversationSignalSchema,
  initiativeDraftSchema,
  initiativeDraftUpdateRequestSchema,
  type ConversationSignal,
  type ConversationSignalLinkRequest,
  type InitiativeDraft,
  type InitiativeDraftUpdateRequest,
} from './learning.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/learning`;

export const conversationSignalsQueryKey = (
  organizationId: string,
  workspaceId?: string,
) => ['conversation-signals', organizationId, workspaceId] as const;

export async function listConversationSignals(
  organizationId: string,
  workspaceId?: string,
  context?: RequestContext,
): Promise<ConversationSignal[]> {
  const params = new URLSearchParams({ organizationId });
  if (workspaceId) params.set('workspace_id', workspaceId);
  return apiFetchJson(
    `${baseUrl}/signals?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: conversationSignalSchema.array() },
  );
}

export async function listConversationInitiativeDrafts(
  organizationId: string,
  conversationId: string,
  context?: RequestContext,
): Promise<InitiativeDraft[]> {
  return apiFetchJson(
    `${baseUrl}/conversations/${conversationId}/initiative-drafts?organizationId=${organizationId}`,
    { method: 'GET' },
    { ...context, responseSchema: initiativeDraftSchema.array() },
  );
}

export async function listBrainAttentionInitiativeDrafts(
  organizationId: string,
  workspaceId?: string,
  context?: RequestContext,
): Promise<InitiativeDraft[]> {
  const params = new URLSearchParams({ organizationId });
  if (workspaceId) params.set('workspace_id', workspaceId);
  return apiFetchJson(
    `${baseUrl}/initiative-drafts/attention?${params.toString()}`,
    { method: 'GET' },
    { ...context, responseSchema: initiativeDraftSchema.array() },
  );
}

export async function getInitiativeDraft(
  organizationId: string,
  draftId: string,
  context?: RequestContext,
): Promise<InitiativeDraft> {
  return apiFetchJson(
    `${baseUrl}/initiative-drafts/${draftId}?organizationId=${organizationId}`,
    { method: 'GET' },
    { ...context, responseSchema: initiativeDraftSchema },
  );
}

export async function updateInitiativeDraft(
  organizationId: string,
  draftId: string,
  payload: InitiativeDraftUpdateRequest,
  context?: RequestContext,
): Promise<InitiativeDraft> {
  const url = `${baseUrl}/initiative-drafts/${draftId}?organizationId=${organizationId}`;
  validateRequestSchema(initiativeDraftUpdateRequestSchema, payload, {
    url,
    schemaName: 'InitiativeDraftUpdateRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: initiativeDraftSchema },
  );
}

export async function approveInitiativeDraft(
  organizationId: string,
  draftId: string,
  context?: RequestContext,
): Promise<InitiativeDraft> {
  return apiFetchJson(
    `${baseUrl}/initiative-drafts/${draftId}/approve?organizationId=${organizationId}`,
    { method: 'POST' },
    { ...context, responseSchema: initiativeDraftSchema },
  );
}

export async function dismissInitiativeDraft(
  organizationId: string,
  draftId: string,
  context?: RequestContext,
): Promise<InitiativeDraft> {
  return apiFetchJson(
    `${baseUrl}/initiative-drafts/${draftId}/dismiss?organizationId=${organizationId}`,
    { method: 'POST' },
    { ...context, responseSchema: initiativeDraftSchema },
  );
}

export async function dismissConversationSignal(
  organizationId: string,
  signalId: string,
  context?: RequestContext,
): Promise<ConversationSignal> {
  const url = `${baseUrl}/signals/${signalId}/dismiss?organizationId=${organizationId}`;
  return apiFetchJson(
    url,
    { method: 'POST' },
    { ...context, responseSchema: conversationSignalSchema },
  );
}

export async function linkConversationSignal(
  organizationId: string,
  signalId: string,
  payload: ConversationSignalLinkRequest,
  context?: RequestContext,
): Promise<ConversationSignal> {
  const url = `${baseUrl}/signals/${signalId}/link?organizationId=${organizationId}`;
  validateRequestSchema(conversationSignalLinkRequestSchema, payload, {
    url,
    schemaName: 'ConversationSignalLinkRequest',
  });
  return apiFetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { ...context, responseSchema: conversationSignalSchema },
  );
}
