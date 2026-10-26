import { z } from 'zod';

export const initiativeBriefSchema = z.object({
  title: z.string(),
  outcome: z.string(),
  stakeholders: z.string(),
  context: z.string(),
  success_criteria: z.string(),
  constraints: z.string(),
  open_questions: z.string(),
});

export type InitiativeBrief = z.infer<typeof initiativeBriefSchema>;

export const initiativeGenerationResponseSchema = z.object({
  brief: initiativeBriefSchema,
});

export type InitiativeGenerationResponse = z.infer<
  typeof initiativeGenerationResponseSchema
>;

export const initiativeSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  workspace_id: z.string().nullable(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
  title: z.string(),
  goal: z.string(),
  brief: initiativeBriefSchema,
  status: z.enum(['draft', 'approved', 'published']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Initiative = z.infer<typeof initiativeSchema>;

export const initiativeListResponseSchema = z.object({
  data: z.array(initiativeSchema),
  count: z.number(),
});

export type InitiativeListResponse = z.infer<
  typeof initiativeListResponseSchema
>;

export const initiativeCreateRequestSchema = z.object({
  goal: z.string().min(1),
  title: z.string().max(200).optional(),
  brief: initiativeBriefSchema.optional(),
  workspace_id: z.string().uuid().nullable().optional(),
});

export type InitiativeCreateRequest = z.infer<
  typeof initiativeCreateRequestSchema
>;

export const initiativeUpdateRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  goal: z.string().min(1).optional(),
  brief: initiativeBriefSchema.optional(),
  status: z.enum(['draft', 'approved']).optional(),
});

export type InitiativeUpdateRequest = z.infer<
  typeof initiativeUpdateRequestSchema
>;
