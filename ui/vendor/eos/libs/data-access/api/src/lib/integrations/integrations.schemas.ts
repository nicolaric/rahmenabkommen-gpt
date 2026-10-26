import { z } from 'zod';

export const integrationConnectionSchema = z.object({
  id: z.string(),
  provider: z.string(),
  status: z.string(),
  scopes: z.array(z.string()),
  provider_account_id: z.string().nullable().optional(),
  provider_account_email: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const integrationConnectionListResponseSchema = z.object({
  data: z.array(integrationConnectionSchema),
  count: z.number(),
});

export const integrationConnectResponseSchema = z.object({
  authorization_url: z.string(),
});

export const outlookDraftRequestSchema = z.object({
  to: z.array(z.string()).min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  body_content_type: z.enum(['HTML', 'Text']).optional(),
});

export const outlookDraftResponseSchema = z.object({
  id: z.string(),
  web_link: z.string().nullable().optional(),
});

export type IntegrationConnection = z.infer<typeof integrationConnectionSchema>;
export type IntegrationConnectionListResponse = z.infer<
  typeof integrationConnectionListResponseSchema
>;
export type IntegrationConnectResponse = z.infer<
  typeof integrationConnectResponseSchema
>;
export type OutlookDraftRequest = z.infer<typeof outlookDraftRequestSchema>;
export type OutlookDraftResponse = z.infer<typeof outlookDraftResponseSchema>;
