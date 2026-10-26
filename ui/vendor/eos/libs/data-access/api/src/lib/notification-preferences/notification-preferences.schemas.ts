import { z } from 'zod';

export const digestFrequencySchema = z.enum(['immediate', 'daily', 'weekly']);

export type DigestFrequency = z.infer<typeof digestFrequencySchema>;

export const notificationPreferencesResponseSchema = z.object({
  email_enabled: z.boolean(),
  agents_enabled: z.boolean(),
  documents_enabled: z.boolean(),
  integrations_enabled: z.boolean(),
  billing_enabled: z.boolean(),
  product_updates_enabled: z.boolean(),
  membership_security_enabled: z.boolean(),
  digest_frequency: digestFrequencySchema,
});

export type NotificationPreferencesResponse = z.infer<
  typeof notificationPreferencesResponseSchema
>;

export const updateNotificationPreferencesRequestSchema = z.object({
  email_enabled: z.boolean().optional(),
  agents_enabled: z.boolean().optional(),
  documents_enabled: z.boolean().optional(),
  integrations_enabled: z.boolean().optional(),
  billing_enabled: z.boolean().optional(),
  product_updates_enabled: z.boolean().optional(),
  membership_security_enabled: z.boolean().optional(),
  digest_frequency: digestFrequencySchema.optional(),
});

export type UpdateNotificationPreferencesRequest = z.infer<
  typeof updateNotificationPreferencesRequestSchema
>;
