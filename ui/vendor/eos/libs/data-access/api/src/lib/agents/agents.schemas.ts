import { z } from 'zod';

export const agentSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']),
  source: z.enum(['custom', 'predefined']).optional(),
  template_version_id: z.string().nullable().optional(),
  system_prompt: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  top_p: z.number().min(0).max(1),
  max_tokens: z.number().nullable().optional(),
  documents_scope: z.enum(['all', 'selected', 'tagged', 'none']),
  document_ids: z.array(z.string()).nullable().optional(),
  document_tags: z.array(z.string()).nullable().optional(),
  tools_enabled: z.array(z.string()),
  external_tool_ids: z.array(z.string()),
  mcp_tool_ids: z.array(z.string()).default([]),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Agent = z.infer<typeof agentSchema>;

export const agentListResponseSchema = z.object({
  data: z.array(agentSchema),
  count: z.number(),
});

export type AgentListResponse = z.infer<typeof agentListResponseSchema>;

export const agentResponseSchema = agentSchema;

export type AgentResponse = z.infer<typeof agentResponseSchema>;

export const agentCreateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']),
  system_prompt: z.string().min(1),
  model: z.string().min(1).max(100),
  temperature: z.number().min(0).max(2),
  top_p: z.number().min(0).max(1),
  max_tokens: z.number().int().positive().nullable().optional(),
  documents_scope: z.enum(['all', 'selected', 'tagged', 'none']),
  document_ids: z.array(z.string()).nullable().optional(),
  document_tags: z.array(z.string()).nullable().optional(),
  tools_enabled: z.array(z.string()).optional(),
  external_tool_ids: z.array(z.string()).optional(),
  mcp_tool_ids: z.array(z.string()).optional(),
});

export type AgentCreateRequest = z.infer<typeof agentCreateRequestSchema>;

export const agentUpdateRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  system_prompt: z.string().min(1).optional(),
  model: z.string().min(1).max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().nullable().optional(),
  documents_scope: z.enum(['all', 'selected', 'tagged', 'none']).optional(),
  document_ids: z.array(z.string()).nullable().optional(),
  document_tags: z.array(z.string()).nullable().optional(),
  tools_enabled: z.array(z.string()).nullable().optional(),
  external_tool_ids: z.array(z.string()).nullable().optional(),
  mcp_tool_ids: z.array(z.string()).nullable().optional(),
});

export type AgentUpdateRequest = z.infer<typeof agentUpdateRequestSchema>;

export const agentDeleteResponseSchema = z.object({
  message: z.string(),
  agent_id: z.string(),
});

export type AgentDeleteResponse = z.infer<typeof agentDeleteResponseSchema>;

export const agentSystemPromptImproveRequestSchema = z.object({
  system_prompt: z.string(),
  instruction: z.string().min(1).max(2000),
});

export type AgentSystemPromptImproveRequest = z.infer<
  typeof agentSystemPromptImproveRequestSchema
>;

export const agentSystemPromptImproveResponseSchema = z.object({
  system_prompt: z.string(),
});

export type AgentSystemPromptImproveResponse = z.infer<
  typeof agentSystemPromptImproveResponseSchema
>;

export const agentSystemPromptPreviewRequestSchema = z.object({
  system_prompt: z.string(),
  question: z.string().min(1).max(2000),
});

export type AgentSystemPromptPreviewRequest = z.infer<
  typeof agentSystemPromptPreviewRequestSchema
>;

export const agentSystemPromptPreviewResponseSchema = z.object({
  answer: z.string(),
});

export type AgentSystemPromptPreviewResponse = z.infer<
  typeof agentSystemPromptPreviewResponseSchema
>;
