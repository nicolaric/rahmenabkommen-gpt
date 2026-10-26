import { z } from 'zod';

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  scopes: z.array(z.string()).nullable().optional(),
  created_at: z.string(),
  last_used_at: z.string().nullable().optional(),
  revoked_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export const apiKeyListResponseSchema = z.object({
  data: z.array(apiKeySchema),
  count: z.number(),
});

export type ApiKeyListResponse = z.infer<typeof apiKeyListResponseSchema>;

export const apiKeyCreateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional(),
  expires_at: z.string().datetime().optional(),
  expires_in_days: z.number().int().min(1).max(3650).optional(),
});

export type ApiKeyCreateRequest = z.infer<typeof apiKeyCreateRequestSchema>;

export const apiKeyCreateResponseSchema = z.object({
  api_key: z.string(),
  data: apiKeySchema,
});

export type ApiKeyCreateResponse = z.infer<typeof apiKeyCreateResponseSchema>;
