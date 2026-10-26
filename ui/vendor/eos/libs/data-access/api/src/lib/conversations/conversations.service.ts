import {
  apiFetch,
  apiFetchJson,
  validateResponseSchema,
} from '@eos/data-access/shared';
import {
  conversationDeleteResponseSchema,
  conversationDocumentContextSchema,
  conversationListResponseSchema,
  conversationCancelResponseSchema,
  conversationResponseSchema,
  conversationUpdateResponseSchema,
  organizationWelcomeInitializationResponseSchema,
} from './conversations.schemas';
import type {
  ConversationCancelResponse,
  ConversationDeleteResponse,
  ConversationDocumentContext,
  ConversationListResponse,
  ConversationResponse,
  ConversationUpdateResponse,
  OrganizationWelcomeInitializationResponse,
} from './conversations.schemas';
import { ApiContextOptions, buildContextQuery } from '../context/context';

const apiUrl = import.meta.env.VITE_API_URL;
const baseUrl = `${apiUrl}/conversations`;

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function initializeOrganizationWelcome(
  organizationId: string,
): Promise<OrganizationWelcomeInitializationResponse> {
  const contextQuery = buildContextQuery(organizationId);
  const response = await apiFetch(`${baseUrl}/welcome?${contextQuery}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = new Error(
      'Failed to initialize organization welcome',
    ) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = response.status;
    error.data = await parseJsonSafe(response);
    throw error;
  }

  const data = (await response.json()) as unknown;
  return validateResponseSchema(
    organizationWelcomeInitializationResponseSchema,
    data,
    {
      url: `${baseUrl}/welcome?${contextQuery}`,
      schemaName: 'OrganizationWelcomeInitializationResponse',
    },
  ) as OrganizationWelcomeInitializationResponse;
}

export async function cancelConversationRequest(
  requestId: string,
  organizationId: string,
  options?: ApiContextOptions,
): Promise<ConversationCancelResponse> {
  const contextQuery = buildContextQuery(organizationId, options);
  const response = await apiFetch(
    `${baseUrl}/cancel/${requestId}?${contextQuery}`,
    {
      method: 'POST',
    },
  );

  if (!response.ok) {
    const error = new Error('Failed to cancel request') as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = response.status;
    error.data = await parseJsonSafe(response);
    throw error;
  }

  const data = (await response.json()) as unknown;
  return validateResponseSchema(conversationCancelResponseSchema, data, {
    url: `${baseUrl}/cancel/${requestId}?${contextQuery}`,
    schemaName: 'ConversationCancelResponse',
  }) as ConversationCancelResponse;
}

export async function listConversations(
  organizationId: string,
  request: Request,
  options?: ApiContextOptions,
): Promise<ConversationListResponse> {
  return apiFetchJson(
    `${baseUrl}?${buildContextQuery(organizationId, options)}`,
    {
      method: 'GET',
    },
    {
      request,
      responseSchema: conversationListResponseSchema,
      schemaName: 'ConversationListResponse',
    },
  );
}

/** A page of the conversation list, optionally matching a search query. */
export type ConversationListPage = {
  q?: string;
  limit?: number;
  offset?: number;
};

export async function listConversationsClient(
  organizationId: string,
  options?: ApiContextOptions,
  page: ConversationListPage = {},
): Promise<ConversationListResponse> {
  const query = new URLSearchParams(buildContextQuery(organizationId, options));
  if (page.q) query.set('q', page.q);
  if (page.limit !== undefined) query.set('limit', String(page.limit));
  if (page.offset !== undefined) query.set('offset', String(page.offset));
  return apiFetchJson(
    `${baseUrl}?${query.toString()}`,
    {
      method: 'GET',
    },
    {
      responseSchema: conversationListResponseSchema,
      schemaName: 'ConversationListResponse',
    },
  );
}

/** Rename and/or pin one of the user's conversations. */
export async function updateConversationClient(
  conversationId: string,
  organizationId: string,
  changes: { title?: string; pinned?: boolean },
  options?: ApiContextOptions,
): Promise<ConversationUpdateResponse> {
  return apiFetchJson(
    `${baseUrl}/${conversationId}?${buildContextQuery(organizationId, options)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    },
    {
      responseSchema: conversationUpdateResponseSchema,
      schemaName: 'ConversationUpdateResponse',
    },
  );
}

export async function getConversation(
  id: string,
  organizationId: string,
  request: Request,
  options?: ApiContextOptions,
): Promise<ConversationResponse> {
  return apiFetchJson(
    `${baseUrl}/${id}?${buildContextQuery(organizationId, options)}`,
    {
      method: 'GET',
    },
    {
      request,
      responseSchema: conversationResponseSchema,
      schemaName: 'ConversationResponse',
    },
  );
}

export async function updateConversationDocumentContext(
  conversationId: string,
  organizationId: string,
  context: ConversationDocumentContext | null,
  options?: ApiContextOptions,
): Promise<ConversationDocumentContext> {
  const contextQuery = buildContextQuery(organizationId, options);
  const url = `${baseUrl}/${conversationId}/document-context?${contextQuery}`;
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });

  if (!response.ok) {
    const error = new Error(
      'Failed to update conversation document context',
    ) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = response.status;
    error.data = await parseJsonSafe(response);
    throw error;
  }

  const data = (await response.json()) as unknown;
  return validateResponseSchema(conversationDocumentContextSchema, data, {
    url,
    schemaName: 'ConversationDocumentContext',
  }) as ConversationDocumentContext;
}

export function generatedArtifactDownloadUrl(
  conversationId: string,
  artifactId: string,
  organizationId: string,
  options?: ApiContextOptions,
): string {
  return `${baseUrl}/${conversationId}/artifacts/${artifactId}/download?${buildContextQuery(organizationId, options)}`;
}

export async function downloadGeneratedArtifact(
  conversationId: string,
  artifactId: string,
  organizationId: string,
  options?: ApiContextOptions,
): Promise<Response> {
  const response = await apiFetch(
    generatedArtifactDownloadUrl(
      conversationId,
      artifactId,
      organizationId,
      options,
    ),
    { method: 'GET' },
  );
  if (!response.ok) {
    throw new Error('Generated artifact is unavailable');
  }
  return response;
}

export async function deleteConversation(
  id: string,
  organizationId: string,
  options?: ApiContextOptions,
): Promise<ConversationDeleteResponse> {
  const contextQuery = buildContextQuery(organizationId, options);
  const req = await apiFetch(`${baseUrl}/${id}?${contextQuery}`, {
    method: 'DELETE',
  });

  if (!req.ok) {
    throw new Error('Failed to delete conversation');
  }

  const data = (await req.json()) as unknown;
  return validateResponseSchema(conversationDeleteResponseSchema, data, {
    url: `${baseUrl}/${id}?${contextQuery}`,
    schemaName: 'ConversationDeleteResponse',
  }) as ConversationDeleteResponse;
}
