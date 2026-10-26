import { z } from 'zod';

export const mcpTransportSchema = z.enum(['sse', 'streamable_http']);
export const mcpAuthTypeSchema = z.enum([
  'none',
  'api_key_header',
  'bearer_token',
  'oauth2',
  'first_party_slack',
  'first_party_rovo',
  'first_party_gmail',
  'first_party_github',
  'first_party_hubspot',
  'first_party_m365_mail',
  'first_party_m365_calendar',
  'first_party_m365_teams',
  'first_party_m365_files',
]);
export const mcpOAuth2ModeSchema = z.enum([
  'authorization_code',
  'client_credentials',
  'refresh_token',
]);

export const mcpHeaderRequestSchema = z.object({
  name: z.string().min(1).max(128),
  value: z.string().min(1),
});

export const mcpHeaderResponseSchema = z.object({
  name: z.string(),
  has_value: z.boolean(),
});

export const mcpOAuth2RequestSchema = z.object({
  mode: mcpOAuth2ModeSchema.default('client_credentials'),
  authorization_url: z.string().nullable().optional(),
  // May be omitted for authorization code with an issuer (e.g. SAP IAS): the
  // API discovers the endpoints from the issuer's OpenID configuration.
  token_url: z.string().optional(),
  issuer: z.string().nullable().optional(),
  client_id: z.string().nullable().optional(),
  client_secret: z.string().nullable().optional(),
  scopes: z.array(z.string()).default([]),
  access_token: z.string().nullable().optional(),
  refresh_token: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export const mcpOAuth2ResponseSchema = z.object({
  mode: mcpOAuth2ModeSchema.nullable().optional(),
  authorization_url: z.string().nullable().optional(),
  token_url: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  client_id: z.string().nullable().optional(),
  scopes: z.array(z.string()).default([]),
  has_client_secret: z.boolean(),
  has_access_token: z.boolean(),
  has_refresh_token: z.boolean(),
  expires_at: z.string().nullable().optional(),
  connected_by_name: z.string().nullable().optional(),
  reconnect_required: z.boolean().optional().default(false),
});

export const mcpAuthRequestSchema = z.object({
  type: mcpAuthTypeSchema,
  header_name: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
  oauth2: mcpOAuth2RequestSchema.nullable().optional(),
});

export const mcpAuthResponseSchema = z.object({
  type: mcpAuthTypeSchema,
  header_name: z.string().nullable().optional(),
  has_value: z.boolean(),
  oauth2: mcpOAuth2ResponseSchema.nullable().optional(),
});

export const mcpToolSchema = z.object({
  id: z.string(),
  server_id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  runtime_name: z.string(),
  description: z.string().nullable().optional(),
  input_schema: z.record(z.string(), z.unknown()),
  enabled: z.boolean(),
  last_discovered_at: z.string().nullable().optional(),
  last_error: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const mcpServerSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  transport: mcpTransportSchema,
  url: z.string(),
  headers: z.array(mcpHeaderResponseSchema),
  auth: mcpAuthResponseSchema,
  enabled: z.boolean(),
  last_discovered_at: z.string().nullable().optional(),
  last_error: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  tools: z.array(mcpToolSchema).default([]),
});

export const mcpServerListResponseSchema = z.object({
  data: z.array(mcpServerSchema),
  count: z.number(),
});

export const mcpServerCreateRequestSchema = z
  .object({
    name: z.string().min(1).max(128),
    transport: mcpTransportSchema.default('streamable_http'),
    url: z.string().min(1),
    headers: z.array(mcpHeaderRequestSchema).optional(),
    auth: mcpAuthRequestSchema.optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export const mcpServerUpdateRequestSchema = z
  .object({
    name: z.string().min(1).max(128).optional(),
    transport: mcpTransportSchema.optional(),
    url: z.string().min(1).optional(),
    headers: z.array(mcpHeaderRequestSchema).optional(),
    auth: mcpAuthRequestSchema.optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export const mcpToolUpdateRequestSchema = z.object({
  runtime_name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  input_schema: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export const mcpDiscoverRequestSchema = z.object({
  tools: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().nullable().optional(),
        input_schema: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .nullable()
    .optional(),
});

export const mcpDiscoverResponseSchema = z.object({
  server: mcpServerSchema,
  tools: z.array(mcpToolSchema),
  count: z.number(),
});

export const mcpOAuth2DiscoveryResponseSchema = z.object({
  authorization_url: z.string().nullable().optional(),
  token_url: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  registration_url: z.string().nullable().optional(),
  scopes: z.array(z.string()).default([]),
  pkce_required: z.boolean(),
  metadata_url: z.string().nullable().optional(),
});

export const mcpOAuth2StartRequestSchema = z.object({
  scopes: z.array(z.string()).nullable().optional(),
  redirect_after: z.string().nullable().optional(),
});

export const mcpOAuth2CallbackUrlResponseSchema = z.object({
  callback_url: z.string(),
});

export const mcpOAuth2StartResponseSchema = z.object({
  authorization_url: z.string(),
});

export const mcpOAuth2StatusResponseSchema = z.object({
  status: z.enum([
    'not_configured',
    'configured',
    'connected',
    'reconnect_required',
  ]),
  provider: z.string().nullable().optional(),
  scopes: z.array(z.string()).default([]),
  expires_at: z.string().nullable().optional(),
  has_access_token: z.boolean(),
  has_refresh_token: z.boolean(),
});

export const mcpTestConnectionResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

export const mcpServerDeleteResponseSchema = z.object({
  message: z.string(),
  server_id: z.string(),
});

export type McpTransport = z.infer<typeof mcpTransportSchema>;
export type McpAuthType = z.infer<typeof mcpAuthTypeSchema>;
export type McpOAuth2Mode = z.infer<typeof mcpOAuth2ModeSchema>;
export type McpHeaderRequest = z.infer<typeof mcpHeaderRequestSchema>;
export type McpAuthRequest = z.infer<typeof mcpAuthRequestSchema>;
export type McpTool = z.infer<typeof mcpToolSchema>;
export type McpServer = z.infer<typeof mcpServerSchema>;
export type McpServerListResponse = z.infer<typeof mcpServerListResponseSchema>;
export type McpServerCreateRequest = z.infer<
  typeof mcpServerCreateRequestSchema
>;
export type McpServerUpdateRequest = z.infer<
  typeof mcpServerUpdateRequestSchema
>;
export type McpToolUpdateRequest = z.infer<typeof mcpToolUpdateRequestSchema>;
export type McpDiscoverRequest = z.infer<typeof mcpDiscoverRequestSchema>;
export type McpDiscoverResponse = z.infer<typeof mcpDiscoverResponseSchema>;
export type McpOAuth2DiscoveryResponse = z.infer<
  typeof mcpOAuth2DiscoveryResponseSchema
>;
export type McpOAuth2StartRequest = z.infer<typeof mcpOAuth2StartRequestSchema>;
export type McpOAuth2CallbackUrlResponse = z.infer<
  typeof mcpOAuth2CallbackUrlResponseSchema
>;
export type McpOAuth2StartResponse = z.infer<
  typeof mcpOAuth2StartResponseSchema
>;
export type McpOAuth2StatusResponse = z.infer<
  typeof mcpOAuth2StatusResponseSchema
>;
export type McpTestConnectionResponse = z.infer<
  typeof mcpTestConnectionResponseSchema
>;
export type McpServerDeleteResponse = z.infer<
  typeof mcpServerDeleteResponseSchema
>;
