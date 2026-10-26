import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  ExternalTool,
  ExternalToolCreateRequest,
  ExternalToolDeleteResponse,
  ExternalToolInvokeRequest,
  ExternalToolListResponse,
  ExternalToolUpdateRequest,
  ExternalToolCollection,
  ExternalToolCollectionListResponse,
  ExternalToolCollectionCreateRequest,
  ExternalToolCollectionUpdateRequest,
  ExternalToolOAuth2StartRequest,
  ExternalToolOAuth2StatusResponse,
  OpenAPIImportPreviewResponse,
  OpenAPIImportRequest,
  OpenAPIImportResponse,
  ExternalToolBulkUpdateRequest,
  ExternalToolBulkUpdateResponse,
} from './external-tools.schemas';
import {
  externalToolCreateRequestSchema,
  externalToolDeleteResponseSchema,
  externalToolInvokeRequestSchema,
  externalToolListResponseSchema,
  externalToolSchema,
  externalToolUpdateRequestSchema,
  externalToolCollectionListResponseSchema,
  externalToolCollectionSchema,
  externalToolCollectionCreateRequestSchema,
  externalToolCollectionUpdateRequestSchema,
  externalToolOAuth2StartRequestSchema,
  externalToolOAuth2StartResponseSchema,
  externalToolOAuth2StatusResponseSchema,
  openAPIImportPreviewResponseSchema,
  openAPIImportRequestSchema,
  openAPIImportResponseSchema,
  externalToolBulkUpdateRequestSchema,
  externalToolBulkUpdateResponseSchema,
} from './external-tools.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/external-tools`;

export async function listExternalTools(
  organizationId: string,
  context?: RequestContext,
): Promise<ExternalToolListResponse> {
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: externalToolListResponseSchema,
      schemaName: 'ExternalToolListResponse',
    },
  );
}

export async function getExternalTool(
  organizationId: string,
  toolId: string,
  context?: RequestContext,
): Promise<ExternalTool> {
  return apiFetchJson(
    `${baseUrl}/${toolId}?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: externalToolSchema,
      schemaName: 'ExternalTool',
    },
  );
}

export async function createExternalTool(
  organizationId: string,
  payload: ExternalToolCreateRequest,
  context?: RequestContext,
): Promise<ExternalTool> {
  validateRequestSchema(externalToolCreateRequestSchema, payload, {
    url: baseUrl,
    schemaName: 'ExternalToolCreateRequest',
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
      requestSchema: externalToolCreateRequestSchema,
      responseSchema: externalToolSchema,
      schemaName: 'ExternalToolCreateResponse',
      requestBody: payload,
    },
  );
}

export async function updateExternalTool(
  organizationId: string,
  toolId: string,
  payload: ExternalToolUpdateRequest,
  context?: RequestContext,
): Promise<ExternalTool> {
  validateRequestSchema(externalToolUpdateRequestSchema, payload, {
    url: baseUrl,
    schemaName: 'ExternalToolUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${toolId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: externalToolUpdateRequestSchema,
      responseSchema: externalToolSchema,
      schemaName: 'ExternalToolUpdateResponse',
      requestBody: payload,
    },
  );
}

export async function deleteExternalTool(
  organizationId: string,
  toolId: string,
  context?: RequestContext,
): Promise<ExternalToolDeleteResponse> {
  return apiFetchJson(
    `${baseUrl}/${toolId}?organizationId=${organizationId}`,
    { method: 'DELETE' },
    {
      ...context,
      responseSchema: externalToolDeleteResponseSchema,
      schemaName: 'ExternalToolDeleteResponse',
    },
  );
}

export async function invokeExternalTool(
  organizationId: string,
  toolId: string,
  payload: ExternalToolInvokeRequest,
  context?: RequestContext,
): Promise<Record<string, unknown>> {
  validateRequestSchema(externalToolInvokeRequestSchema, payload, {
    url: `${baseUrl}/${toolId}/invoke`,
    schemaName: 'ExternalToolInvokeRequest',
  });
  return apiFetchJson(
    `${baseUrl}/${toolId}/invoke?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: externalToolInvokeRequestSchema,
      schemaName: 'ExternalToolInvokeResponse',
      requestBody: payload,
    },
  );
}

// Collection functions
export async function listExternalToolCollections(
  organizationId: string,
  context?: RequestContext,
): Promise<ExternalToolCollectionListResponse> {
  return apiFetchJson(
    `${baseUrl}/collections?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: externalToolCollectionListResponseSchema,
      schemaName: 'ExternalToolCollectionListResponse',
    },
  );
}

export async function createExternalToolCollection(
  organizationId: string,
  payload: ExternalToolCollectionCreateRequest,
  context?: RequestContext,
): Promise<ExternalToolCollection> {
  validateRequestSchema(externalToolCollectionCreateRequestSchema, payload, {
    url: `${baseUrl}/collections`,
    schemaName: 'ExternalToolCollectionCreateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/collections?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: externalToolCollectionCreateRequestSchema,
      responseSchema: externalToolCollectionSchema,
      schemaName: 'ExternalToolCollectionCreateResponse',
      requestBody: payload,
    },
  );
}

export async function updateExternalToolCollection(
  organizationId: string,
  collectionId: string,
  payload: ExternalToolCollectionUpdateRequest,
  context?: RequestContext,
): Promise<ExternalToolCollection> {
  validateRequestSchema(externalToolCollectionUpdateRequestSchema, payload, {
    url: `${baseUrl}/collections`,
    schemaName: 'ExternalToolCollectionUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/collections/${collectionId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: externalToolCollectionUpdateRequestSchema,
      responseSchema: externalToolCollectionSchema,
      schemaName: 'ExternalToolCollectionUpdateResponse',
      requestBody: payload,
    },
  );
}

export async function startExternalToolCollectionOAuth2(
  organizationId: string,
  collectionId: string,
  payload: ExternalToolOAuth2StartRequest = {},
  context?: RequestContext,
): Promise<{ authorization_url: string }> {
  return apiFetchJson(
    `${baseUrl}/collections/${collectionId}/oauth2/start?organizationId=${organizationId}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    {
      ...context,
      requestSchema: externalToolOAuth2StartRequestSchema,
      responseSchema: externalToolOAuth2StartResponseSchema,
      schemaName: 'ExternalToolOAuth2StartResponse',
      requestBody: payload,
    },
  );
}

export async function getExternalToolCollectionOAuth2Status(
  organizationId: string,
  collectionId: string,
  context?: RequestContext,
): Promise<ExternalToolOAuth2StatusResponse> {
  return apiFetchJson(
    `${baseUrl}/collections/${collectionId}/oauth2/status?organizationId=${organizationId}`,
    { method: 'GET' },
    { ...context, responseSchema: externalToolOAuth2StatusResponseSchema, schemaName: 'ExternalToolOAuth2StatusResponse' },
  );
}

export async function deleteExternalToolCollection(
  organizationId: string,
  collectionId: string,
  context?: RequestContext,
): Promise<ExternalToolDeleteResponse> {
  return apiFetchJson(
    `${baseUrl}/collections/${collectionId}?organizationId=${organizationId}`,
    { method: 'DELETE' },
    {
      ...context,
      responseSchema: externalToolDeleteResponseSchema,
      schemaName: 'ExternalToolCollectionDeleteResponse',
    },
  );
}

// OpenAPI import functions
export async function previewOpenAPIImport(
  organizationId: string,
  payload: OpenAPIImportRequest,
  context?: RequestContext,
): Promise<OpenAPIImportPreviewResponse> {
  validateRequestSchema(openAPIImportRequestSchema, payload, {
    url: `${baseUrl}/import-openapi/preview`,
    schemaName: 'OpenAPIImportRequest',
  });
  return apiFetchJson(
    `${baseUrl}/import-openapi/preview?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: openAPIImportRequestSchema,
      responseSchema: openAPIImportPreviewResponseSchema,
      schemaName: 'OpenAPIImportPreviewResponse',
      requestBody: payload,
    },
  );
}

export async function importOpenAPI(
  organizationId: string,
  payload: OpenAPIImportRequest,
  context?: RequestContext,
): Promise<OpenAPIImportResponse> {
  validateRequestSchema(openAPIImportRequestSchema, payload, {
    url: `${baseUrl}/import-openapi`,
    schemaName: 'OpenAPIImportRequest',
  });
  return apiFetchJson(
    `${baseUrl}/import-openapi?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: openAPIImportRequestSchema,
      responseSchema: openAPIImportResponseSchema,
      schemaName: 'OpenAPIImportResponse',
      requestBody: payload,
    },
  );
}

// Bulk update tools in a collection
export async function bulkUpdateToolsInCollection(
  organizationId: string,
  collectionId: string,
  payload: ExternalToolBulkUpdateRequest,
  context?: RequestContext,
): Promise<ExternalToolBulkUpdateResponse> {
  validateRequestSchema(externalToolBulkUpdateRequestSchema, payload, {
    url: `${baseUrl}/collections`,
    schemaName: 'ExternalToolBulkUpdateRequest',
  });
  return apiFetchJson(
    `${baseUrl}/collections/${collectionId}/tools?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: externalToolBulkUpdateRequestSchema,
      responseSchema: externalToolBulkUpdateResponseSchema,
      schemaName: 'ExternalToolBulkUpdateResponse',
      requestBody: payload,
    },
  );
}
