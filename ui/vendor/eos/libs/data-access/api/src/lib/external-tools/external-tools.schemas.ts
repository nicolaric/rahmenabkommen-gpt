import { z } from 'zod';

export const externalToolOAuth2ModeSchema = z.enum([
  'authorization_code',
  'client_credentials',
  'refresh_token',
]);

export const externalToolOAuth2Schema = z.object({
  mode: externalToolOAuth2ModeSchema.default('client_credentials'),
  authorization_url: z.string().nullable().optional(),
  token_url: z.string().min(1),
  issuer: z.string().nullable().optional(),
  client_id: z.string().nullable().optional(),
  client_secret: z.string().nullable().optional(),
  scopes: z.array(z.string()).default([]),
  access_token: z.string().nullable().optional(),
  refresh_token: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  token_type: z.string().optional(),
});

export const externalToolAuthSchema = z.object({
  type: z.enum(['none', 'api_key_header', 'bearer_token', 'oauth1', 'oauth2']),
  header_name: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
  oauth2: externalToolOAuth2Schema.nullable().optional(),
});

export type ExternalToolAuth = z.infer<typeof externalToolAuthSchema>;

export const externalToolHeaderSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

export type ExternalToolHeader = z.infer<typeof externalToolHeaderSchema>;

export const externalToolAuthResponseSchema = z.object({
  type: z.enum(['none', 'api_key_header', 'bearer_token', 'oauth1', 'oauth2']),
  header_name: z.string().nullable().optional(),
  has_value: z.boolean(),
});

export type ExternalToolAuthResponse = z.infer<
  typeof externalToolAuthResponseSchema
>;

export const externalToolHeaderResponseSchema = z.object({
  name: z.string(),
  has_value: z.boolean(),
});

export type ExternalToolHeaderResponse = z.infer<
  typeof externalToolHeaderResponseSchema
>;

// Collection auth response schema
export const externalToolOAuth2ResponseSchema = z.object({
  mode: externalToolOAuth2ModeSchema.nullable().optional(),
  authorization_url: z.string().nullable().optional(),
  token_url: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  client_id: z.string().nullable().optional(),
  scopes: z.array(z.string()).default([]),
  has_client_secret: z.boolean().default(false),
  has_access_token: z.boolean().default(false),
  has_refresh_token: z.boolean().default(false),
  expires_at: z.string().nullable().optional(),
});

export const externalToolCollectionAuthResponseSchema = z.object({
  type: z.enum(['none', 'api_key_header', 'bearer_token', 'oauth1', 'oauth2']),
  header_name: z.string().nullable().optional(),
  has_value: z.boolean(),
  oauth2: externalToolOAuth2ResponseSchema.nullable().optional(),
});

export type ExternalToolCollectionAuthResponse = z.infer<
  typeof externalToolCollectionAuthResponseSchema
>;

// Collection schema
export const externalToolCollectionSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  base_url: z.string().nullable().optional(),
  auth: externalToolCollectionAuthResponseSchema,
  openapi_source: z.string().nullable().optional(),
  imported_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  tool_count: z.number(),
});

export type ExternalToolCollection = z.infer<
  typeof externalToolCollectionSchema
>;

export const externalToolOAuth2StartRequestSchema = z.object({
  scopes: z.array(z.string()).optional(),
  redirect_after: z.string().optional(),
});
export type ExternalToolOAuth2StartRequest = z.infer<
  typeof externalToolOAuth2StartRequestSchema
>;
export const externalToolOAuth2StartResponseSchema = z.object({
  authorization_url: z.string(),
});
export const externalToolOAuth2StatusResponseSchema = z.object({
  status: z.enum(['not_configured', 'configured', 'connected', 'reconnect_required']),
  scopes: z.array(z.string()).default([]),
  expires_at: z.string().nullable().optional(),
  has_access_token: z.boolean().default(false),
  has_refresh_token: z.boolean().default(false),
});
export type ExternalToolOAuth2StatusResponse = z.infer<
  typeof externalToolOAuth2StatusResponseSchema
>;

export const externalToolCollectionListResponseSchema = z.object({
  data: z.array(externalToolCollectionSchema),
  count: z.number(),
});

export type ExternalToolCollectionListResponse = z.infer<
  typeof externalToolCollectionListResponseSchema
>;

export const externalToolSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  collection_id: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string(),
  headers: z.array(externalToolHeaderResponseSchema),
  auth: externalToolAuthResponseSchema,
  input_schema: z.record(z.string(), z.any()),
  enabled: z.boolean().default(true),
  source: z.enum(['custom', 'predefined']).optional().default('custom'),
  template_version_id: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ExternalTool = z.infer<typeof externalToolSchema>;

export const externalToolListResponseSchema = z.object({
  data: z.array(externalToolSchema),
  count: z.number(),
});

export type ExternalToolListResponse = z.infer<
  typeof externalToolListResponseSchema
>;

export const externalToolCreateRequestSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().nullable().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().min(1),
  collection_id: z.string().nullable().optional(),
  headers: z.array(externalToolHeaderSchema).optional(),
  auth: externalToolAuthSchema.optional(),
  input_schema: z.record(z.string(), z.any()),
});

export type ExternalToolCreateRequest = z.infer<
  typeof externalToolCreateRequestSchema
>;

export const externalToolUpdateRequestSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().nullable().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  url: z.string().optional(),
  collection_id: z.string().nullable().optional(),
  headers: z.array(externalToolHeaderSchema).optional(),
  auth: externalToolAuthSchema.optional(),
  input_schema: z.record(z.string(), z.any()).optional(),
  enabled: z.boolean().optional(),
});

export type ExternalToolUpdateRequest = z.infer<
  typeof externalToolUpdateRequestSchema
>;

export const externalToolDeleteResponseSchema = z.object({
  message: z.string(),
  tool_id: z.string(),
});

export type ExternalToolDeleteResponse = z.infer<
  typeof externalToolDeleteResponseSchema
>;

export const externalToolInvokeRequestSchema = z.object({
  input: z.record(z.string(), z.any()).optional(),
});

export type ExternalToolInvokeRequest = z.infer<
  typeof externalToolInvokeRequestSchema
>;

// Collection create/update schemas
export const externalToolCollectionCreateRequestSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().nullable().optional(),
  auth: externalToolAuthSchema.optional(),
});

export type ExternalToolCollectionCreateRequest = z.infer<
  typeof externalToolCollectionCreateRequestSchema
>;

export const externalToolCollectionUpdateRequestSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().nullable().optional(),
  auth: externalToolAuthSchema.optional(),
});

export type ExternalToolCollectionUpdateRequest = z.infer<
  typeof externalToolCollectionUpdateRequestSchema
>;

// OpenAPI import schemas
export const openAPIToolPreviewSchema = z.object({
  name: z.string(),
  method: z.string(),
  path: z.string(),
  description: z.string().nullable().optional(),
  has_request_body: z.boolean(),
});

export type OpenAPIToolPreview = z.infer<typeof openAPIToolPreviewSchema>;
export type OpenAPIOAuth2Scheme = z.infer<typeof openAPIOAuth2SchemeSchema>;

export const openAPIOAuth2SchemeSchema = z.object({
  name: z.string(),
  mode: externalToolOAuth2ModeSchema,
  authorization_url: z.string().nullable().optional(),
  token_url: z.string(),
  scopes: z.array(z.string()).default([]),
});

export const openAPIImportPreviewResponseSchema = z.object({
  collection_name: z.string(),
  base_url: z.string().nullable().optional(),
  tools_found: z.number(),
  tools_preview: z.array(openAPIToolPreviewSchema),
  warnings: z.array(z.string()),
  oauth2_schemes: z.array(openAPIOAuth2SchemeSchema).default([]),
});

export type OpenAPIImportPreviewResponse = z.infer<
  typeof openAPIImportPreviewResponseSchema
>;

export const openAPIImportRequestSchema = z.object({
  openapi_url: z.string().optional(),
  spec_content: z.record(z.string(), z.any()).optional(),
  collection_name: z.string().optional(),
  auth_override: externalToolAuthSchema.optional(),
  headers: z.array(externalToolHeaderSchema).optional(),
  selected_tools: z.array(z.string()).optional(),
});

export type OpenAPIImportRequest = z.infer<typeof openAPIImportRequestSchema>;

export const openAPIImportResponseSchema = z.object({
  collection: externalToolCollectionSchema,
  tools_created: z.number(),
  tools: z.array(externalToolSchema),
});

export type OpenAPIImportResponse = z.infer<typeof openAPIImportResponseSchema>;

// Bulk update schemas
export const externalToolBulkUpdateRequestSchema = z.object({
  headers: z.array(externalToolHeaderSchema).optional(),
  auth: externalToolAuthSchema.optional(),
});

export type ExternalToolBulkUpdateRequest = z.infer<
  typeof externalToolBulkUpdateRequestSchema
>;

export const externalToolBulkUpdateResponseSchema = z.object({
  updated_count: z.number(),
  tools: z.array(externalToolSchema),
});

export type ExternalToolBulkUpdateResponse = z.infer<
  typeof externalToolBulkUpdateResponseSchema
>;
