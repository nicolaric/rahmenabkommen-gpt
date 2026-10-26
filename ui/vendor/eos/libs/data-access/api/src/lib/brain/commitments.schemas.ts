import { z } from 'zod';

export const commitmentStatusSchema = z.enum([
  'suggested',
  'open',
  'done',
  'dismissed',
]);

export const commitmentSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  initiative_id: z.string().uuid().nullable(),
  initiative_title: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable(),
  category_name: z.string().nullable().optional(),
  title: z.string(),
  details: z.string().nullable(),
  status: commitmentStatusSchema,
  origin: z.string(),
  due_at: z.string().nullable(),
  is_overdue: z.boolean(),
  owner_identity_id: z.string().nullable(),
  conversation_id: z.string().uuid().nullable(),
  message_id: z.string().uuid().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
});

export const commitmentListSchema = z.object({
  data: z.array(commitmentSchema),
  count: z.number().int().nonnegative(),
});

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const commitmentCreateRequestSchema = z.object({
  title: z.string().trim().min(1).max(300),
  details: z.string().max(10_000).nullable().optional(),
  workspace_id: z.string().uuid().nullable().optional(),
  initiative_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  owner_identity_id: z.string().max(36).nullable().optional(),
  due_at: isoDateSchema.nullable().optional(),
});

export const commitmentUpdateRequestSchema = commitmentCreateRequestSchema
  .omit({ workspace_id: true })
  .partial();

export const commitmentStatusRequestSchema = z.object({
  status: z.enum(['open', 'done', 'dismissed']),
});

export const commitmentCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const commitmentCategoryListSchema = z.object({
  data: z.array(commitmentCategorySchema),
});

export const commitmentCategoryCreateRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const commitmentCategoryUpdateRequestSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  archived: z.boolean().optional(),
});

export type CommitmentStatus = z.infer<typeof commitmentStatusSchema>;
export type Commitment = z.infer<typeof commitmentSchema>;
export type CommitmentList = z.infer<typeof commitmentListSchema>;
export type CommitmentCreateRequest = z.infer<
  typeof commitmentCreateRequestSchema
>;
export type CommitmentUpdateRequest = z.infer<
  typeof commitmentUpdateRequestSchema
>;
export type CommitmentStatusRequest = z.infer<
  typeof commitmentStatusRequestSchema
>;
export type CommitmentCategory = z.infer<typeof commitmentCategorySchema>;
export type CommitmentCategoryCreateRequest = z.infer<
  typeof commitmentCategoryCreateRequestSchema
>;
export type CommitmentCategoryUpdateRequest = z.infer<
  typeof commitmentCategoryUpdateRequestSchema
>;
