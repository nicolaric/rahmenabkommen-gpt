import { z } from 'zod';

export const answerRetrievalDepthSchema = z.enum([
  'fast',
  'balanced',
  'thorough',
  'exhaustive',
]);

export type AnswerRetrievalDepth = z.infer<typeof answerRetrievalDepthSchema>;

export const organizationCreateRequestSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  locale: z.enum(['en', 'de']).optional(),
});

export type OrganizationCreateRequest = z.infer<
  typeof organizationCreateRequestSchema
>;

/**
 * All fields optional, mirroring the API: PUT /organizations/{id} accepts a
 * partial update and rejects only a payload with nothing set. Requiring `name`
 * here would make single-field updates (e.g. a settings toggle) fail client-side
 * validation before the request was ever sent.
 */
export const organizationUpdateRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  system_prompt: z.string().nullable().optional(),
  llm_model: z.string().max(100).nullable().optional(),
  enable_workspaces: z.boolean().optional(),
  answer_retrieval_depth: answerRetrievalDepthSchema.optional(),
  conversation_learning_capture_enabled: z.boolean().optional(),
  brain_enabled: z.boolean().optional(),
  api_paid_overage_enabled: z.boolean().optional(),
  api_overage_cap_minor_units: z.number().int().min(0).optional(),
});

export type OrganizationUpdateRequest = z.infer<
  typeof organizationUpdateRequestSchema
>;

/**
 * Boolean plan entitlements, keyed by feature name. Kept open-ended so a newer
 * API that reports additional features does not fail validation in an older
 * client; unknown features are simply ignored by callers.
 */
export const organizationFeaturesSchema = z.record(z.string(), z.boolean());

export type OrganizationFeatures = z.infer<typeof organizationFeaturesSchema>;

export const organizationResponseSchema = z.object({
  id: z.string(),
  llm_model: z.string().max(100).nullable().optional(),
  conversation_learning_capture_enabled: z.boolean().default(false),
  brain_enabled: z.boolean().default(false),
});

export const organizationLocaleResponseSchema = z.object({
  locale: z.enum(['en', 'de']),
});

export type OrganizationLocaleResponse = z.infer<
  typeof organizationLocaleResponseSchema
>;

export const organizationLogoResponseSchema = z.object({
  logo_content_hash: z.string(),
});

/**
 * Included and paid-overage usage for an organization.
 *
 * Amounts are integer minor currency units (rappen/cents), never floats: they
 * are summed server-side across many message rows, and the UI is the only place
 * that should convert to a human-readable amount.
 */
export const overageUsageResponseSchema = z.object({
  included_used: z.number().int(),
  included_limit: z.number().int().nullable(),
  documents_used: z.number().int(),
  documents_limit: z.number().int().nullable(),
  agents_used: z.number().int(),
  agents_limit: z.number().int().nullable(),
  tools_used: z.number().int(),
  tools_limit: z.number().int().nullable(),
  api_paid_overage_enabled: z.boolean(),
  overage_accrued_minor_units: z.number().int(),
  overage_cap_minor_units: z.number().int(),
  currency: z.string(),
  period_start: z.string(),
  ineligibility_reason: z.string().nullable(),
  overage_available: z.boolean(),
});

export type OverageUsageResponse = z.infer<typeof overageUsageResponseSchema>;

export type OrganizationLogoResponse = z.infer<
  typeof organizationLogoResponseSchema
>;

export type OrganizationResponse = z.infer<
  typeof organizationResponseSchema
> & {
  [key: string]: unknown;
};

export const adminOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  creator_identity_id: z.string(),
  system_prompt: z.string().nullable(),
  llm_model: z.string().max(100).nullable().optional(),
  is_deactivated: z.boolean(),
  enable_workspaces: z.boolean(),
  answer_retrieval_depth: answerRetrievalDepthSchema.default('balanced'),
  conversation_learning_capture_enabled: z.boolean().default(false),
  brain_enabled: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
  member_count: z.number().nullable(),
  document_count: z.number().nullable(),
  question_count: z.number().nullable(),
  stripe_customer_id: z.string().nullable(),
  subscription_status: z.string().nullable(),
  logo_content_hash: z.string().nullable().optional(),
  features: organizationFeaturesSchema.optional(),
  user_role: z.string().nullable(),
});

export type AdminOrganization = z.infer<typeof adminOrganizationSchema>;

export const adminOrganizationListResponseSchema = z.object({
  data: z.array(adminOrganizationSchema),
  count: z.number(),
});

export type AdminOrganizationListResponse = z.infer<
  typeof adminOrganizationListResponseSchema
>;
