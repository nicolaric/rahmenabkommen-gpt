/**
 * Client for the Flask API in ../api, which stores conversations for sharing,
 * the feed, the stats page and the sitemap. Only called from loaders and
 * actions: write endpoints need INTERNAL_API_TOKEN, which never reaches the
 * browser.
 */
import type { SharedConversation } from './shared-conversation';
import type { StatsResponse } from './api/models/stats';

export type BackendMessage = {
  question: string;
  answer: string;
  timestamp: string;
  sources: unknown;
};

function getEnv() {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, '');
  if (!backendUrl) throw new Error('BACKEND_URL is not configured');
  return { backendUrl, token: process.env.INTERNAL_API_TOKEN };
}

async function backend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { backendUrl, token } = getEnv();
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Response(response.statusText, { status: response.status });
  }

  return (await response.json()) as T;
}

export function syncConversation(sessionId: string, messages: BackendMessage[]) {
  return backend<{ id: string }>('/conversations/sync', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, messages }),
  });
}

export function shareConversation(sessionId: string) {
  return backend<{ id: string; shared: boolean; posted_in_feed: boolean }>(
    '/conversations/share',
    {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    },
  );
}

export function getSharedConversation(id: string) {
  return backend<SharedConversation>(
    `/conversations/${encodeURIComponent(id)}`,
  );
}

export function getStats() {
  return backend<StatsResponse>('/stats');
}
