import { apiFetch, apiFetchJson, RequestContext } from '@eos/data-access/shared';
import {
  integrationConnectResponseSchema,
  integrationConnectionListResponseSchema,
  outlookDraftResponseSchema,
  type IntegrationConnectResponse,
  type IntegrationConnectionListResponse,
  type OutlookDraftRequest,
  type OutlookDraftResponse,
} from './integrations.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/integrations`;

export async function listIntegrationConnections(
  organizationId: string,
  context?: RequestContext,
): Promise<IntegrationConnectionListResponse> {
  return apiFetchJson(
    `${baseUrl}/connections?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: integrationConnectionListResponseSchema,
      schemaName: 'IntegrationConnectionListResponse',
    },
  );
}

export async function startGmailConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<IntegrationConnectResponse> {
  return apiFetchJson(
    `${baseUrl}/gmail/connect?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: integrationConnectResponseSchema,
      schemaName: 'IntegrationConnectResponse',
    },
  );
}

export async function startSlackConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<IntegrationConnectResponse> {
  return apiFetchJson(
    `${baseUrl}/slack/connect?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: integrationConnectResponseSchema,
      schemaName: 'IntegrationConnectResponse',
    },
  );
}

export async function startOutlookConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<IntegrationConnectResponse> {
  return apiFetchJson(
    `${baseUrl}/outlook/connect?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: integrationConnectResponseSchema,
      schemaName: 'IntegrationConnectResponse',
    },
  );
}

export async function startRovoConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<IntegrationConnectResponse> {
  return apiFetchJson(
    `${baseUrl}/rovo/connect?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: integrationConnectResponseSchema,
      schemaName: 'IntegrationConnectResponse',
    },
  );
}

export async function startHubspotConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<IntegrationConnectResponse> {
  return apiFetchJson(
    `${baseUrl}/hubspot/connect?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: integrationConnectResponseSchema,
      schemaName: 'IntegrationConnectResponse',
    },
  );
}

export async function startGithubConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<IntegrationConnectResponse> {
  return apiFetchJson(
    `${baseUrl}/github/connect?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: integrationConnectResponseSchema,
      schemaName: 'IntegrationConnectResponse',
    },
  );
}

export async function createOutlookDraft(
  organizationId: string,
  payload: OutlookDraftRequest,
  context?: RequestContext,
): Promise<OutlookDraftResponse> {
  return apiFetchJson(
    `${baseUrl}/outlook/drafts?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: outlookDraftResponseSchema,
      schemaName: 'OutlookDraftResponse',
    },
  );
}

export async function disconnectGmailConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    `${baseUrl}/gmail/disconnect?organizationId=${organizationId}`,
    { method: 'POST' },
    context,
  );

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
}

export async function disconnectSlackConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    `${baseUrl}/slack/disconnect?organizationId=${organizationId}`,
    { method: 'POST' },
    context,
  );

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
}

export async function disconnectOutlookConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    `${baseUrl}/outlook/disconnect?organizationId=${organizationId}`,
    { method: 'POST' },
    context,
  );

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
}

export async function disconnectRovoConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    `${baseUrl}/rovo/disconnect?organizationId=${organizationId}`,
    { method: 'POST' },
    context,
  );

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
}

export async function disconnectHubspotConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    `${baseUrl}/hubspot/disconnect?organizationId=${organizationId}`,
    { method: 'POST' },
    context,
  );

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
}

export async function disconnectGithubConnection(
  organizationId: string,
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    `${baseUrl}/github/disconnect?organizationId=${organizationId}`,
    { method: 'POST' },
    context,
  );

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
}
