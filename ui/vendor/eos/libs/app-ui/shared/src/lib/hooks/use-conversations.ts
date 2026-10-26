import {
  type ConversationListResponse,
  listConversationsClient,
} from '@eos/data-access/api';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

/** Conversations per page of the sidebar list. */
export const CONVERSATION_PAGE_SIZE = 50;

/**
 * The user's conversations, newest (and pinned) first, loaded page by page.
 * `data` keeps the single-response shape callers already use; call
 * `fetchNextPage` while `hasNextPage` to load older conversations.
 */
export function useConversations(orgId?: string, workspaceId?: string) {
  return useInfiniteQuery({
    queryKey: ['conversations', orgId, workspaceId],
    queryFn: ({ pageParam }) =>
      listConversationsClient(
        orgId as string,
        { workspaceId },
        { limit: CONVERSATION_PAGE_SIZE, offset: pageParam },
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.data.length, 0);
      return loaded < lastPage.total && lastPage.data.length > 0
        ? loaded
        : undefined;
    },
    select: (result): ConversationListResponse => {
      const lastPage = result.pages[result.pages.length - 1];
      return {
        data: result.pages.flatMap((page) => page.data),
        total: lastPage?.total ?? 0,
        limit: CONVERSATION_PAGE_SIZE,
        offset: 0,
      };
    },
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });
}

/** Server-side search over titles and messages, for the command palette. */
export function useConversationSearch(
  orgId: string | undefined,
  workspaceId: string | undefined,
  query: string,
) {
  const q = query.trim();
  return useQuery({
    queryKey: ['conversations', orgId, workspaceId, 'search', q],
    queryFn: () =>
      listConversationsClient(
        orgId as string,
        { workspaceId },
        { q, limit: 20 },
      ),
    enabled: Boolean(orgId) && q.length > 0,
    staleTime: 30_000,
  });
}
