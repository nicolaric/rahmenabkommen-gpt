import { useSyncExternalStore } from 'react';
import { openaiConversationStreamManager } from './openai-stream-manager';

export function useOpenAIConversationStreams() {
  return useSyncExternalStore(
    (listener) => openaiConversationStreamManager.subscribe(listener),
    () => openaiConversationStreamManager.getSnapshot(),
    () => openaiConversationStreamManager.getSnapshot(),
  );
}

export function useOpenAIConversationStream(conversationId: string) {
  const streams = useOpenAIConversationStreams();
  return streams.get(conversationId) ?? null;
}

// Shell UI only needs completion, title, and unread state. Keeping this
// separate prevents token updates from rerendering the entire dashboard.
export function useOpenAIConversationStreamActivities() {
  return useSyncExternalStore(
    (listener) => openaiConversationStreamManager.subscribeActivity(listener),
    () => openaiConversationStreamManager.getActivitySnapshot(),
    () => openaiConversationStreamManager.getActivitySnapshot(),
  );
}
