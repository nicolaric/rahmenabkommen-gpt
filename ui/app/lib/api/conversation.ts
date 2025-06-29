import { api } from './api';
import { Conversation, ConversationShare } from './models/conversation';

// URL from .env
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export async function shareConversation(body: {
    sessionId: string;
    postedInFeed?: boolean;
}): Promise<ConversationShare> {
    return api<ConversationShare>(`${backendUrl}/conversations/share`, {
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
    return api<Conversation>(`${backendUrl}/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function getFeed(): Promise<Conversation[]> {
    return api<Conversation[]>(`${backendUrl}/conversations/feed`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
