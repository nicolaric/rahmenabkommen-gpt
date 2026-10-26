import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesRequest,
} from './notification-preferences.schemas';
import {
  notificationPreferencesResponseSchema,
  updateNotificationPreferencesRequestSchema,
} from './notification-preferences.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/users/me/notification-preferences`;

export async function getNotificationPreferences(
  context?: RequestContext,
): Promise<NotificationPreferencesResponse> {
  return apiFetchJson(
    baseUrl,
    { method: 'GET' },
    {
      ...context,
      responseSchema: notificationPreferencesResponseSchema,
      schemaName: 'NotificationPreferencesResponse',
    },
  );
}

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferencesRequest,
  context?: RequestContext,
): Promise<NotificationPreferencesResponse> {
  validateRequestSchema(updateNotificationPreferencesRequestSchema, payload, {
    url: baseUrl,
    schemaName: 'UpdateNotificationPreferencesRequest',
  });
  return apiFetchJson(
    baseUrl,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: notificationPreferencesResponseSchema,
      schemaName: 'NotificationPreferencesResponse',
      requestBody: payload,
    },
  );
}
