import { Conversation, ConversationShare } from './models/conversation';

const baseUrl = import.meta.env.VITE_API_URL;

export async function shareConversation(body: {
  sessionId: string;
  postedInFeed?: boolean;
}): Promise<ConversationShare> {
  return api<ConversationShare>(`${baseUrl}/conversations/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: body.sessionId,
      posted_in_feed: body.postedInFeed,
    }),
  });
}

export function getConversation(conversationId: string): Promise<Conversation> {
  return api<Conversation>(`${baseUrl}/conversations/${conversationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function getFeed(): Promise<Conversation[]> {
  return api<Conversation[]>(`${baseUrl}/conversations/feed`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function api<T>(path: string, req: RequestInit): Promise<T> {
  const response = await fetch(path, req);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return (await response.json()) as T;
}
