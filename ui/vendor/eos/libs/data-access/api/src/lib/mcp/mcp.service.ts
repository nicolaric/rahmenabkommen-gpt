import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  McpDiscoverRequest,
  McpDiscoverResponse,
  McpOAuth2CallbackUrlResponse,
  McpOAuth2DiscoveryResponse,
  McpOAuth2StartRequest,
  McpOAuth2StartResponse,
  McpOAuth2StatusResponse,
  McpServer,
  McpServerCreateRequest,
  McpServerDeleteResponse,
  McpServerListResponse,
  McpServerUpdateRequest,
  McpTestConnectionResponse,
  McpTool,
  McpToolUpdateRequest,
} from './mcp.schemas';
import {
  mcpDiscoverRequestSchema,
  mcpDiscoverResponseSchema,
  mcpOAuth2CallbackUrlResponseSchema,
  mcpOAuth2DiscoveryResponseSchema,
  mcpOAuth2StartRequestSchema,
  mcpOAuth2StartResponseSchema,
  mcpOAuth2StatusResponseSchema,
  mcpServerCreateRequestSchema,
  mcpServerDeleteResponseSchema,
  mcpServerListResponseSchema,
  mcpServerSchema,
  mcpServerUpdateRequestSchema,
  mcpTestConnectionResponseSchema,
  mcpToolSchema,
  mcpToolUpdateRequestSchema,
} from './mcp.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/mcp`;

export async function listMcpServers(
  organizationId: string,
  context?: RequestContext,
): Promise<McpServerListResponse> {
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: mcpServerListResponseSchema,
      schemaName: 'McpServerListResponse',
    },
  );
}

export async function createMcpServer(
  organizationId: string,
  payload: McpServerCreateRequest,
  context?: RequestContext,
): Promise<McpServer> {
  validateRequestSchema(mcpServerCreateRequestSchema, payload, {
    url: baseUrl,
    schemaName: 'McpServerCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: mcpServerCreateRequestSchema,
      responseSchema: mcpServerSchema,
      schemaName: 'McpServerCreateResponse',
      requestBody: payload,
    },
  );
}

export async function updateMcpServer(
  organizationId: string,
  serverId: string,
  payload: McpServerUpdateRequest,
  context?: RequestContext,
): Promise<McpServer> {
  validateRequestSchema(mcpServerUpdateRequestSchema, payload, {
    url: `${baseUrl}/${serverId}`,
    schemaName: 'McpServerUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${serverId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: mcpServerUpdateRequestSchema,
      responseSchema: mcpServerSchema,
      schemaName: 'McpServerUpdateResponse',
      requestBody: payload,
    },
  );
}

export async function deleteMcpServer(
  organizationId: string,
  serverId: string,
  context?: RequestContext,
): Promise<McpServerDeleteResponse> {
  return apiFetchJson(
    `${baseUrl}/${serverId}?organizationId=${organizationId}`,
    { method: 'DELETE' },
    {
      ...context,
      responseSchema: mcpServerDeleteResponseSchema,
      schemaName: 'McpServerDeleteResponse',
    },
  );
}

export async function testMcpServerPayload(
  organizationId: string,
  payload: McpServerCreateRequest,
  context?: RequestContext,
): Promise<McpTestConnectionResponse> {
  validateRequestSchema(mcpServerCreateRequestSchema, payload, {
    url: `${baseUrl}/test`,
    schemaName: 'McpServerCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/test?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: mcpServerCreateRequestSchema,
      responseSchema: mcpTestConnectionResponseSchema,
      schemaName: 'McpTestConnectionResponse',
      requestBody: payload,
    },
  );
}

export async function discoverMcpOAuth2(
  organizationId: string,
  serverId: string,
  context?: RequestContext,
): Promise<McpOAuth2DiscoveryResponse> {
  return apiFetchJson(
    `${baseUrl}/${serverId}/oauth2/discover?organizationId=${organizationId}`,
    { method: 'POST' },
    {
      ...context,
      responseSchema: mcpOAuth2DiscoveryResponseSchema,
      schemaName: 'McpOAuth2DiscoveryResponse',
    },
  );
}

export async function startMcpOAuth2(
  organizationId: string,
  serverId: string,
  payload: McpOAuth2StartRequest = {},
  context?: RequestContext,
): Promise<McpOAuth2StartResponse> {
  validateRequestSchema(mcpOAuth2StartRequestSchema, payload, {
    url: `${baseUrl}/${serverId}/oauth2/start`,
    schemaName: 'McpOAuth2StartRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${serverId}/oauth2/start?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: mcpOAuth2StartRequestSchema,
      responseSchema: mcpOAuth2StartResponseSchema,
      schemaName: 'McpOAuth2StartResponse',
      requestBody: payload,
    },
  );
}

/** The redirect URI to register at the identity provider (e.g. SAP IAS). */
export async function getMcpOAuth2CallbackUrl(
  organizationId: string,
  context?: RequestContext,
): Promise<McpOAuth2CallbackUrlResponse> {
  return apiFetchJson(
    `${baseUrl}/oauth2/callback-url?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: mcpOAuth2CallbackUrlResponseSchema,
      schemaName: 'McpOAuth2CallbackUrlResponse',
    },
  );
}

export async function getMcpOAuth2Status(
  organizationId: string,
  serverId: string,
  context?: RequestContext,
): Promise<McpOAuth2StatusResponse> {
  return apiFetchJson(
    `${baseUrl}/${serverId}/oauth2/status?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: mcpOAuth2StatusResponseSchema,
      schemaName: 'McpOAuth2StatusResponse',
    },
  );
}

export async function testMcpServer(
  organizationId: string,
  serverId: string,
  context?: RequestContext,
): Promise<McpTestConnectionResponse> {
  return apiFetchJson(
    `${baseUrl}/${serverId}/test?organizationId=${organizationId}`,
    { method: 'POST' },
    {
      ...context,
      responseSchema: mcpTestConnectionResponseSchema,
      schemaName: 'McpTestConnectionResponse',
    },
  );
}

export async function discoverMcpTools(
  organizationId: string,
  serverId: string,
  payload: McpDiscoverRequest = {},
  context?: RequestContext,
): Promise<McpDiscoverResponse> {
  validateRequestSchema(mcpDiscoverRequestSchema, payload, {
    url: `${baseUrl}/${serverId}/discover`,
    schemaName: 'McpDiscoverRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${serverId}/discover?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: mcpDiscoverRequestSchema,
      responseSchema: mcpDiscoverResponseSchema,
      schemaName: 'McpDiscoverResponse',
      requestBody: payload,
    },
  );
}

export async function updateMcpTool(
  organizationId: string,
  toolId: string,
  payload: McpToolUpdateRequest,
  context?: RequestContext,
): Promise<McpTool> {
  validateRequestSchema(mcpToolUpdateRequestSchema, payload, {
    url: `${baseUrl}/tools/${toolId}`,
    schemaName: 'McpToolUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/tools/${toolId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: mcpToolUpdateRequestSchema,
      responseSchema: mcpToolSchema,
      schemaName: 'McpToolUpdateResponse',
      requestBody: payload,
    },
  );
}
