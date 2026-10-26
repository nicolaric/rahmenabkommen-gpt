import {
  apiFetch,
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  AgentListResponse,
  AgentResponse,
  AgentCreateRequest,
  AgentUpdateRequest,
  AgentDeleteResponse,
  AgentSystemPromptImproveRequest,
  AgentSystemPromptImproveResponse,
  AgentSystemPromptPreviewRequest,
  AgentSystemPromptPreviewResponse,
} from './agents.schemas';
import {
  agentListResponseSchema,
  agentResponseSchema,
  agentCreateRequestSchema,
  agentUpdateRequestSchema,
  agentDeleteResponseSchema,
  agentSystemPromptImproveRequestSchema,
  agentSystemPromptImproveResponseSchema,
  agentSystemPromptPreviewRequestSchema,
  agentSystemPromptPreviewResponseSchema,
} from './agents.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/agents`;

export async function listAgents(
  organizationId: string,
  context?: RequestContext,
): Promise<AgentListResponse> {
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    {
      method: 'GET',
    },
    {
      ...context,
      responseSchema: agentListResponseSchema,
      schemaName: 'AgentListResponse',
    },
  );
}

export async function getAgent(
  organizationId: string,
  agentId: string,
  context?: RequestContext,
): Promise<AgentResponse> {
  return apiFetchJson(
    `${baseUrl}/${agentId}?organizationId=${organizationId}`,
    {
      method: 'GET',
    },
    {
      ...context,
      responseSchema: agentResponseSchema,
      schemaName: 'AgentResponse',
    },
  );
}

export async function createAgent(
  organizationId: string,
  payload: AgentCreateRequest,
  context?: RequestContext,
): Promise<AgentResponse> {
  validateRequestSchema(agentCreateRequestSchema, payload, {
    url: baseUrl,
    schemaName: 'AgentCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: agentCreateRequestSchema,
      responseSchema: agentResponseSchema,
      schemaName: 'AgentCreateResponse',
      requestBody: payload,
    },
  );
}

export async function updateAgent(
  organizationId: string,
  agentId: string,
  payload: AgentUpdateRequest,
  context?: RequestContext,
): Promise<AgentResponse> {
  validateRequestSchema(agentUpdateRequestSchema, payload, {
    url: `${baseUrl}/${agentId}`,
    schemaName: 'AgentUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${agentId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: agentUpdateRequestSchema,
      responseSchema: agentResponseSchema,
      schemaName: 'AgentUpdateResponse',
      requestBody: payload,
    },
  );
}

export async function deleteAgent(
  organizationId: string,
  agentId: string,
  context?: RequestContext,
): Promise<AgentDeleteResponse> {
  return apiFetchJson(
    `${baseUrl}/${agentId}?organizationId=${organizationId}`,
    {
      method: 'DELETE',
    },
    {
      ...context,
      responseSchema: agentDeleteResponseSchema,
      schemaName: 'AgentDeleteResponse',
    },
  );
}

export async function improveAgentSystemPrompt(
  organizationId: string,
  payload: AgentSystemPromptImproveRequest,
  context?: RequestContext,
): Promise<AgentSystemPromptImproveResponse> {
  validateRequestSchema(agentSystemPromptImproveRequestSchema, payload, {
    url: `${baseUrl}/system-prompt/improve`,
    schemaName: 'AgentSystemPromptImproveRequest',
  });
  return apiFetchJson(
    `${baseUrl}/system-prompt/improve?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: agentSystemPromptImproveRequestSchema,
      responseSchema: agentSystemPromptImproveResponseSchema,
      schemaName: 'AgentSystemPromptImproveResponse',
      requestBody: payload,
    },
  );
}

export async function previewAgentSystemPrompt(
  organizationId: string,
  payload: AgentSystemPromptPreviewRequest,
  context?: RequestContext,
): Promise<AgentSystemPromptPreviewResponse> {
  validateRequestSchema(agentSystemPromptPreviewRequestSchema, payload, {
    url: `${baseUrl}/system-prompt/preview`,
    schemaName: 'AgentSystemPromptPreviewRequest',
  });
  return apiFetchJson(
    `${baseUrl}/system-prompt/preview?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: agentSystemPromptPreviewRequestSchema,
      responseSchema: agentSystemPromptPreviewResponseSchema,
      schemaName: 'AgentSystemPromptPreviewResponse',
      requestBody: payload,
    },
  );
}

type ImproveStreamEvent = { delta?: string; done?: boolean; error?: string };

/**
 * Streams a rewritten system prompt, yielding text deltas as they arrive.
 * Returns normally only once the server confirms the rewrite is complete;
 * a failed or truncated stream throws, so partial text is never mistaken for
 * the finished prompt.
 */
export async function* streamImprovedAgentSystemPrompt(
  organizationId: string,
  payload: AgentSystemPromptImproveRequest,
  options?: { signal?: AbortSignal },
): AsyncGenerator<string, void, unknown> {
  validateRequestSchema(agentSystemPromptImproveRequestSchema, payload, {
    url: `${baseUrl}/system-prompt/improve/stream`,
    schemaName: 'AgentSystemPromptImproveRequest',
  });
  const response = await apiFetch(
    `${baseUrl}/system-prompt/improve/stream?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
      signal: options?.signal,
    },
  );

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = ((await response.json()) as { detail?: unknown }).detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(
      typeof detail === 'string' && detail.trim()
        ? detail
        : `System prompt improvement failed (${response.status})`,
    );
  }
  if (!response.body) {
    throw new Error('Response body is empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const event = JSON.parse(
          line.slice('data: '.length),
        ) as ImproveStreamEvent;
        if (event.error) throw new Error(event.error);
        if (event.done) return;
        if (event.delta) yield event.delta;
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new Error('The improved system prompt stream ended unexpectedly');
}
