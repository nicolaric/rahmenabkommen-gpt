import { apiFetch } from '@eos/data-access/shared';
import { buildContextQuery } from '../context/context';
import type {
  ChatCompletionChunk,
  ChatCompletionRequest,
} from './openai.schemas';

const apiUrl = import.meta.env.VITE_API_URL;
const baseUrl = `${apiUrl}/chat/completions`;

export type ApiContextOptions = {
  workspaceId?: string;
};

export type OpenAIStreamCallbacks = {
  onChunk?: (chunk: ChatCompletionChunk) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
};

export async function* streamChatCompletion(
  request: ChatCompletionRequest,
  organizationId: string,
  cookie?: string,
  options?: ApiContextOptions,
): AsyncGenerator<ChatCompletionChunk, void, unknown> {
  const contextQuery = buildContextQuery(organizationId, options);
  const response = await apiFetch(
    `${baseUrl}?${contextQuery}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(request),
    },
    cookie ? { cookie } : undefined,
  );

  if (!response.ok) {
    let detail: unknown;
    try {
      const body = (await response.json()) as { detail?: unknown };
      detail = body.detail;
    } catch {
      // ignore parse errors
    }
    // The status has to travel with the error: callers distinguish a plan
    // limit (402) from a transient failure, and a bare Error would make every
    // rejection look the same.
    const error = new Error(
      typeof detail === 'string' && detail.trim()
        ? detail
        : `Chat completion request failed (${response.status})`,
    ) as Error & { status: number; detail?: unknown };
    error.status = response.status;
    error.detail = detail;
    throw error;
  }

  const body = response.body;
  if (!body) {
    throw new Error('Response body is empty');
  }

  const reader = body.getReader();
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
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (!trimmed.startsWith('data: ')) continue;

        const payload = trimmed.slice('data: '.length).trim();
        if (payload === '[DONE]') {
          return;
        }

        let chunk: ChatCompletionChunk;
        try {
          chunk = JSON.parse(payload) as ChatCompletionChunk;
        } catch (error) {
          console.error('Failed to parse SSE chunk:', payload, error);
          continue;
        }

        yield chunk;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
