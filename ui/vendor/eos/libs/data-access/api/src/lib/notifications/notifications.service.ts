import {
  apiFetchJson,
  RequestContext,
} from '@eos/data-access/shared';
import type {
  MarkAllReadResponse,
  NotificationListResponse,
  UnreadCountResponse,
} from './notifications.schemas';
import {
  markAllReadResponseSchema,
  notificationListResponseSchema,
  unreadCountResponseSchema,
} from './notifications.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/notifications`;

export async function listNotifications(
  params: { limit?: number; offset?: number } = {},
  context?: RequestContext,
): Promise<NotificationListResponse> {
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.offset !== undefined) search.set('offset', String(params.offset));
  const query = search.toString();

  return apiFetchJson(
    `${baseUrl}${query ? `?${query}` : ''}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: notificationListResponseSchema,
      schemaName: 'NotificationListResponse',
    },
  );
}

export async function getUnreadNotificationCount(
  context?: RequestContext,
): Promise<UnreadCountResponse> {
  return apiFetchJson(
    `${baseUrl}/unread-count`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: unreadCountResponseSchema,
      schemaName: 'UnreadCountResponse',
    },
  );
}

export async function markNotificationRead(
  notificationId: string,
  context?: RequestContext,
): Promise<void> {
  await apiFetchJson(
    `${baseUrl}/${notificationId}/read`,
    { method: 'POST' },
    {
      ...context,
      schemaName: 'MarkNotificationRead',
    },
  );
}

export async function markAllNotificationsRead(
  context?: RequestContext,
): Promise<MarkAllReadResponse> {
  return apiFetchJson(
    `${baseUrl}/read-all`,
    { method: 'POST' },
    {
      ...context,
      responseSchema: markAllReadResponseSchema,
      schemaName: 'MarkAllReadResponse',
    },
  );
}
