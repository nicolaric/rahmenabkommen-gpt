import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@eos/data-access/api';
import type { NotificationListResponse } from '@eos/data-access/api';

const UNREAD_COUNT_POLL_MS = 30_000;

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadNotificationCount(),
    refetchInterval: UNREAD_COUNT_POLL_MS,
    staleTime: UNREAD_COUNT_POLL_MS,
  });
}

export function useNotifications(
  options: {
    enabled?: boolean;
    limit?: number;
    offset?: number;
    initialData?: NotificationListResponse;
  } = {},
) {
  const limit = options.limit ?? 20;
  const offset = options.offset;

  return useQuery({
    queryKey: ['notifications', 'list', { limit, offset }],
    queryFn: () => listNotifications({ limit, offset }),
    enabled: options.enabled ?? true,
    staleTime: 10_000,
    initialData: options.initialData,
  });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

  return {
    markRead: async (notificationId: string) => {
      await markNotificationRead(notificationId);
      await invalidate();
    },
    markAllRead: async () => {
      await markAllNotificationsRead();
      await invalidate();
    },
  };
}
