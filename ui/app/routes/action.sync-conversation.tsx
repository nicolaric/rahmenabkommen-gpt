/**
 * Stores a yeos conversation in the Flask backend (stats, sharing) and, with
 * intent=share, marks it as shared.
 *
 * The browser only sends the conversation id. Questions, answers and sources
 * are read from eos-api with the service key, so nobody can store or share
 * answers the assistant never gave.
 */
import { data } from 'react-router';
import type { Route } from './+types/action.sync-conversation';
import {
  shareConversation,
  syncConversation,
  type BackendMessage,
} from '../lib/backend.server';
import { getEosConversation } from '../lib/eos.server';
import type { EosSources } from '../lib/shared-conversation';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const conversationId = formData.get('conversationId');
  const intent = formData.get('intent');

  if (typeof conversationId !== 'string' || !conversationId) {
    return data({ error: 'conversationId is required' }, { status: 400 });
  }

  // The browser sees its stream end slightly before yeos marks the answer as
  // finished, so wait a moment for it rather than skipping the answer
  let conversation = await getEosConversation(conversationId);
  for (let attempt = 0; conversation.is_streaming && attempt < 10; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    conversation = await getEosConversation(conversationId);
  }

  const messages: BackendMessage[] = conversation.messages.map((message) => ({
    question: message.question,
    answer: message.answer ?? '',
    timestamp: message.timestamp,
    sources: {
      format: 'eos',
      sources: message.sources,
      citations: message.citations,
    } satisfies EosSources,
  }));

  // An answer still streaming after the wait is stored by the next sync
  if (conversation.is_streaming) messages.pop();
  if (messages.length === 0) {
    return data({ error: 'No finished answer yet' }, { status: 409 });
  }

  const { id } = await syncConversation(conversation.id, messages);

  if (intent === 'share') {
    await shareConversation(conversation.id);
  }

  return { id };
}
