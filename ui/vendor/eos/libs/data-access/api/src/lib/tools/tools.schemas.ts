import { z } from 'zod';

export const webfetchConfigSchema = z.object({
  blocklist: z.array(z.string()),
  max_pages: z.number().min(1).max(10),
  timeout: z.number().min(1).max(120),
});

export type WebfetchConfig = z.infer<typeof webfetchConfigSchema>;

export const toolConfigSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  config: webfetchConfigSchema.nullable().optional(),
});

export type ToolConfig = z.infer<typeof toolConfigSchema>;

export const toolsConfigResponseSchema = z.object({
  tools: z.array(toolConfigSchema),
});

export type ToolsConfigResponse = z.infer<typeof toolsConfigResponseSchema>;

export const webfetchConfigUpdateSchema = z.object({
  blocklist: z.array(z.string()).optional(),
  max_pages: z.number().min(1).max(10).optional(),
  timeout: z.number().min(1).max(120).optional(),
});

export type WebfetchConfigUpdate = z.infer<typeof webfetchConfigUpdateSchema>;

export const toolConfigUpdateSchema = z.object({
  name: z.string(),
  enabled: z.boolean().optional(),
  config: webfetchConfigUpdateSchema.optional(),
});

export type ToolConfigUpdate = z.infer<typeof toolConfigUpdateSchema>;

export const toolsConfigUpdateRequestSchema = z.object({
  tools: z.array(toolConfigUpdateSchema),
});

export type ToolsConfigUpdateRequest = z.infer<
  typeof toolsConfigUpdateRequestSchema
>;
