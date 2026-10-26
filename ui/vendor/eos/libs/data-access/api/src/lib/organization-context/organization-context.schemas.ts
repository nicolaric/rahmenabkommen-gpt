import { z } from 'zod';

export const organizationContextStatusSchema = z.enum(['active', 'archived']);
export type OrganizationContextStatus = z.infer<
  typeof organizationContextStatusSchema
>;

export const organizationContextEntrySchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  workspace_id: z.string().nullable(),
  kind: z.string(),
  title: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  status: organizationContextStatusSchema,
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
  source_type: z.string().nullable(),
  source_label: z.string().nullable(),
  source_document_id: z.string().nullable(),
  source_snapshot: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type OrganizationContextEntry = z.infer<
  typeof organizationContextEntrySchema
>;

export const organizationContextListResponseSchema = z.object({
  data: z.array(organizationContextEntrySchema),
  count: z.number(),
});
export type OrganizationContextListResponse = z.infer<
  typeof organizationContextListResponseSchema
>;

export const organizationContextCreateRequestSchema = z.object({
  kind: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(100_000),
  metadata: z.record(z.string(), z.unknown()).default({}),
  workspace_id: z.string().uuid().nullable().optional(),
  source_type: z.string().max(64).nullable().optional(),
  source_label: z.string().max(255).nullable().optional(),
  source_document_id: z.string().uuid().nullable().optional(),
  source_snapshot: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type OrganizationContextCreateRequest = z.infer<
  typeof organizationContextCreateRequestSchema
>;

export const organizationContextUpdateRequestSchema = z.object({
  kind: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(100_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  source_type: z.string().max(64).nullable().optional(),
  source_label: z.string().max(255).nullable().optional(),
  source_document_id: z.string().uuid().nullable().optional(),
  source_snapshot: z.record(z.string(), z.unknown()).nullable().optional(),
  status: organizationContextStatusSchema.optional(),
});
export type OrganizationContextUpdateRequest = z.infer<
  typeof organizationContextUpdateRequestSchema
>;

export type OrganizationContextListOptions = {
  workspaceId?: string;
  kind?: string;
  status?: OrganizationContextStatus;
  search?: string;
};
