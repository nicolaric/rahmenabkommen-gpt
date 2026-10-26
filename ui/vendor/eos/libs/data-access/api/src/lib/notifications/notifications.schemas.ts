import { z } from 'zod';

export const notificationResponseSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  title: z.string(),
  body: z.string(),
  action_url: z.string().nullable(),
  organization_id: z.string(),
  workspace_id: z.string().nullable(),
  read: z.boolean(),
  created_at: z.string(),
});

export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

export const notificationListResponseSchema = z.object({
  data: z.array(notificationResponseSchema),
  unread_count: z.number(),
  has_more: z.boolean(),
});

export type NotificationListResponse = z.infer<
  typeof notificationListResponseSchema
>;

export const unreadCountResponseSchema = z.object({
  unread_count: z.number(),
});

export type UnreadCountResponse = z.infer<typeof unreadCountResponseSchema>;

export const markAllReadResponseSchema = z.object({
  marked_read: z.number(),
});

export type MarkAllReadResponse = z.infer<typeof markAllReadResponseSchema>;
