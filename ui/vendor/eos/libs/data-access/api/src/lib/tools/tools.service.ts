import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  ToolsConfigResponse,
  ToolsConfigUpdateRequest,
} from './tools.schemas';
import {
  toolsConfigResponseSchema,
  toolsConfigUpdateRequestSchema,
} from './tools.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/tools`;

export async function getToolsConfig(
  organizationId: string,
  context?: RequestContext,
): Promise<ToolsConfigResponse> {
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    {
      method: 'GET',
    },
    {
      ...context,
      responseSchema: toolsConfigResponseSchema,
      schemaName: 'ToolsConfigResponse',
    },
  );
}

export async function updateToolsConfig(
  organizationId: string,
  payload: ToolsConfigUpdateRequest,
  context?: RequestContext,
): Promise<ToolsConfigResponse> {
  validateRequestSchema(toolsConfigUpdateRequestSchema, payload, {
    url: baseUrl,
    schemaName: 'ToolsConfigUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: toolsConfigUpdateRequestSchema,
      responseSchema: toolsConfigResponseSchema,
      schemaName: 'ToolsConfigUpdateResponse',
      requestBody: payload,
    },
  );
}
