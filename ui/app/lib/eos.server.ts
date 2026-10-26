/**
 * Server-side access to eos-api (yeos) with the organization's service key.
 * Shared by the browser proxy route and the conversation sync action.
 */
import type { ConversationStreamMessage } from '@eos/app-ui/shared/client';

export function getEosEnv() {
  const apiUrl = process.env.EOS_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.EOS_API_SERVICE_KEY;
  const organizationId = process.env.YEOS_ORGANIZATION_ID;
  const workspaceId = process.env.YEOS_WORKSPACE_ID || undefined;

  if (!apiUrl || !apiKey || !organizationId) {
    throw new Error(
      'Missing EOS_API_URL / EOS_API_SERVICE_KEY / YEOS_ORGANIZATION_ID configuration',
    );
  }

  return { apiUrl, apiKey, organizationId, workspaceId };
}

/** Builds an eos-api URL pinned to our organization and workspace. */
export function eosUrl(path: string, search = '') {
  const { apiUrl, organizationId, workspaceId } = getEosEnv();
  const query = new URLSearchParams(search);
  query.set('organizationId', organizationId);
  if (workspaceId) {
    query.set('workspaceId', workspaceId);
  } else {
    query.delete('workspaceId');
  }
  return `${apiUrl}/v1/${path}?${query.toString()}`;
}

export type EosMessage = Pick<
  ConversationStreamMessage,
  'id' | 'question' | 'answer' | 'timestamp' | 'sources' | 'citations'
>;

type EosConversation = {
  id: string;
  is_streaming: boolean;
  messages: EosMessage[];
};

export async function getEosConversation(conversationId: string) {
  const { apiKey } = getEosEnv();
  const response = await fetch(
    eosUrl(`conversations/${encodeURIComponent(conversationId)}`),
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Response('Conversation not found', { status: response.status });
  }

  return (await response.json()) as EosConversation;
}
