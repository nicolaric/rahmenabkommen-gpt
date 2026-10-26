import { z } from 'zod';

export const updateProfileRequestSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  webauthn_login_enabled: z.boolean().optional(),
  locale: z.enum(['en', 'de']).optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const profileResponseSchema = z.object({
  identity_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  webauthn_login_enabled: z.boolean(),
  locale: z.string().nullable().optional(),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;

export const mfaStatusResponseSchema = z.object({
  totp_enabled: z.boolean(),
  passkey_enabled: z.boolean().default(false),
  show_setup_prompt: z.boolean(),
});

export type MfaStatusResponse = z.infer<typeof mfaStatusResponseSchema>;

export const effectiveLocaleResponseSchema = z.object({
  locale: z.enum(['en', 'de']).nullable(),
  source: z.enum(['profile', 'organization', 'none']),
});

export type EffectiveLocaleResponse = z.infer<
  typeof effectiveLocaleResponseSchema
>;

export const adminUserSchema = z.object({
  identity_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  state: z.string().nullable(),
  schema_id: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  organization_count: z.number(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUserListResponseSchema = z.object({
  data: z.array(adminUserSchema),
  page: z.number(),
  page_size: z.number(),
  count: z.number(),
  has_more: z.boolean(),
  next_page_token: z.string().nullable().optional(),
});

export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;
