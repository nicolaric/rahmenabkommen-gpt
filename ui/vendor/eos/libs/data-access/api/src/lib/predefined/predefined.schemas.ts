import { z } from 'zod';
import {
  externalToolAuthSchema,
  externalToolAuthResponseSchema,
  externalToolHeaderSchema,
  externalToolHeaderResponseSchema,
} from '../external-tools/external-tools.schemas';

export const predefinedOrgStateSchema = z.object({
  status: z.enum(['enabled', 'disabled', 'removed']),
  installed_id: z.string().nullable().optional(),
  template_version_id: z.string().nullable().optional(),
});

export type PredefinedOrgState = z.infer<typeof predefinedOrgStateSchema>;

export const predefinedOrgStateUpdateRequestSchema = z.object({
  status: z.enum(['enabled', 'disabled', 'removed']),
});

export type PredefinedOrgStateUpdateRequest = z.infer<
  typeof predefinedOrgStateUpdateRequestSchema
>;

const predefinedAgentTemplateBaseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']),
  system_prompt: z.string().min(1),
  model: z.string().min(1).max(100),
  temperature: z.number().min(0).max(2),
  top_p: z.number().min(0).max(1),
  max_tokens: z.number().int().positive().nullable().optional(),
  documents_scope: z.enum(['all', 'selected']),
  document_ids: z.array(z.string()).nullable().optional(),
  tools_enabled: z.array(z.string()).optional(),
  external_tool_template_ids: z.array(z.string()).optional(),
});

export const predefinedAgentTemplateCreateRequestSchema =
  predefinedAgentTemplateBaseSchema.extend({
    version: z.string().min(1).max(32),
  });

export type PredefinedAgentTemplateCreateRequest = z.infer<
  typeof predefinedAgentTemplateCreateRequestSchema
>;

export const predefinedAgentTemplateVersionRequestSchema =
  predefinedAgentTemplateBaseSchema.extend({
    version: z.string().min(1).max(32),
  });

export type PredefinedAgentTemplateVersionRequest = z.infer<
  typeof predefinedAgentTemplateVersionRequestSchema
>;

export const predefinedAgentTemplateVersionSchema = z.object({
  id: z.string(),
  template_id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']),
  system_prompt: z.string(),
  model: z.string(),
  temperature: z.number(),
  top_p: z.number(),
  max_tokens: z.number().nullable().optional(),
  documents_scope: z.enum(['all', 'selected']),
  document_ids: z.array(z.string()).nullable().optional(),
  tools_enabled: z.array(z.string()),
  external_tool_template_ids: z.array(z.string()),
  created_at: z.string(),
});

export type PredefinedAgentTemplateVersion = z.infer<
  typeof predefinedAgentTemplateVersionSchema
>;

export const predefinedAgentTemplateSchema = z.object({
  id: z.string(),
  latest_version: predefinedAgentTemplateVersionSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type PredefinedAgentTemplate = z.infer<
  typeof predefinedAgentTemplateSchema
>;

export const predefinedAgentTemplateListResponseSchema = z.object({
  data: z.array(predefinedAgentTemplateSchema),
  count: z.number(),
});

export type PredefinedAgentTemplateListResponse = z.infer<
  typeof predefinedAgentTemplateListResponseSchema
>;

export const predefinedAgentTemplateOrgResponseSchema = z.object({
  template: predefinedAgentTemplateSchema,
  org_state: predefinedOrgStateSchema.nullable().optional(),
});

export type PredefinedAgentTemplateOrgResponse = z.infer<
  typeof predefinedAgentTemplateOrgResponseSchema
>;

export const predefinedAgentTemplateOrgListResponseSchema = z.object({
  data: z.array(predefinedAgentTemplateOrgResponseSchema),
  count: z.number(),
});

export type PredefinedAgentTemplateOrgListResponse = z.infer<
  typeof predefinedAgentTemplateOrgListResponseSchema
>;

const predefinedExternalToolTemplateBaseSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().nullable().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().min(1),
  headers: z.array(externalToolHeaderSchema).nullable().optional(),
  auth: externalToolAuthSchema.nullable().optional(),
  input_schema: z.record(z.string(), z.any()),
});

export const predefinedExternalToolTemplateCreateRequestSchema =
  predefinedExternalToolTemplateBaseSchema.extend({
    version: z.string().min(1).max(32),
  });

export type PredefinedExternalToolTemplateCreateRequest = z.infer<
  typeof predefinedExternalToolTemplateCreateRequestSchema
>;

export const predefinedExternalToolTemplateVersionRequestSchema =
  predefinedExternalToolTemplateBaseSchema.extend({
    version: z.string().min(1).max(32),
  });

export type PredefinedExternalToolTemplateVersionRequest = z.infer<
  typeof predefinedExternalToolTemplateVersionRequestSchema
>;

export const predefinedExternalToolTemplateVersionSchema = z.object({
  id: z.string(),
  template_id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string(),
  headers: z.array(externalToolHeaderResponseSchema),
  auth: externalToolAuthResponseSchema,
  input_schema: z.record(z.string(), z.any()),
  created_at: z.string(),
});

export type PredefinedExternalToolTemplateVersion = z.infer<
  typeof predefinedExternalToolTemplateVersionSchema
>;

export const predefinedExternalToolTemplateSchema = z.object({
  id: z.string(),
  latest_version: predefinedExternalToolTemplateVersionSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type PredefinedExternalToolTemplate = z.infer<
  typeof predefinedExternalToolTemplateSchema
>;

export const predefinedExternalToolTemplateListResponseSchema = z.object({
  data: z.array(predefinedExternalToolTemplateSchema),
  count: z.number(),
});

export type PredefinedExternalToolTemplateListResponse = z.infer<
  typeof predefinedExternalToolTemplateListResponseSchema
>;

export const predefinedExternalToolTemplateOrgResponseSchema = z.object({
  template: predefinedExternalToolTemplateSchema,
  org_state: predefinedOrgStateSchema.nullable().optional(),
});

export type PredefinedExternalToolTemplateOrgResponse = z.infer<
  typeof predefinedExternalToolTemplateOrgResponseSchema
>;

export const predefinedExternalToolTemplateOrgListResponseSchema = z.object({
  data: z.array(predefinedExternalToolTemplateOrgResponseSchema),
  count: z.number(),
});

export type PredefinedExternalToolTemplateOrgListResponse = z.infer<
  typeof predefinedExternalToolTemplateOrgListResponseSchema
>;

export const predefinedTemplateDeleteResponseSchema = z.object({
  message: z.string(),
  template_id: z.string(),
});

export type PredefinedTemplateDeleteResponse = z.infer<
  typeof predefinedTemplateDeleteResponseSchema
>;
