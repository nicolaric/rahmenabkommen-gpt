import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  PredefinedAgentTemplateCreateRequest,
  PredefinedAgentTemplateListResponse,
  PredefinedAgentTemplateOrgListResponse,
  PredefinedAgentTemplateVersionRequest,
  PredefinedAgentTemplateVersion,
  PredefinedExternalToolTemplateCreateRequest,
  PredefinedExternalToolTemplateListResponse,
  PredefinedExternalToolTemplateOrgListResponse,
  PredefinedExternalToolTemplateVersionRequest,
  PredefinedExternalToolTemplateVersion,
  PredefinedOrgState,
  PredefinedOrgStateUpdateRequest,
  PredefinedTemplateDeleteResponse,
} from './predefined.schemas';
import {
  predefinedAgentTemplateCreateRequestSchema,
  predefinedAgentTemplateListResponseSchema,
  predefinedAgentTemplateOrgListResponseSchema,
  predefinedAgentTemplateVersionRequestSchema,
  predefinedAgentTemplateVersionSchema,
  predefinedExternalToolTemplateCreateRequestSchema,
  predefinedExternalToolTemplateListResponseSchema,
  predefinedExternalToolTemplateOrgListResponseSchema,
  predefinedExternalToolTemplateVersionRequestSchema,
  predefinedExternalToolTemplateVersionSchema,
  predefinedOrgStateSchema,
  predefinedOrgStateUpdateRequestSchema,
  predefinedTemplateDeleteResponseSchema,
} from './predefined.schemas';

const adminBaseUrl = `${import.meta.env.VITE_API_URL}/admin/predefined`;
const orgBaseUrl = `${import.meta.env.VITE_API_URL}/predefined`;

export async function listPredefinedAgentTemplates(
  context?: RequestContext,
): Promise<PredefinedAgentTemplateListResponse> {
  return apiFetchJson(
    `${adminBaseUrl}/agents/templates`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: predefinedAgentTemplateListResponseSchema,
      schemaName: 'PredefinedAgentTemplateListResponse',
    },
  );
}

export async function createPredefinedAgentTemplate(
  payload: PredefinedAgentTemplateCreateRequest,
  context?: RequestContext,
): Promise<PredefinedAgentTemplateVersion> {
  validateRequestSchema(predefinedAgentTemplateCreateRequestSchema, payload, {
    url: `${adminBaseUrl}/agents/templates`,
    schemaName: 'PredefinedAgentTemplateCreateRequest',
  });
  return apiFetchJson(
    `${adminBaseUrl}/agents/templates`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: predefinedAgentTemplateCreateRequestSchema,
      responseSchema: predefinedAgentTemplateVersionSchema,
      schemaName: 'PredefinedAgentTemplateCreateResponse',
      requestBody: payload,
    },
  );
}

export async function publishPredefinedAgentTemplateVersion(
  templateId: string,
  payload: PredefinedAgentTemplateVersionRequest,
  context?: RequestContext,
): Promise<PredefinedAgentTemplateVersion> {
  validateRequestSchema(predefinedAgentTemplateVersionRequestSchema, payload, {
    url: `${adminBaseUrl}/agents/templates/${templateId}/versions`,
    schemaName: 'PredefinedAgentTemplateVersionRequest',
  });
  return apiFetchJson(
    `${adminBaseUrl}/agents/templates/${templateId}/versions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: predefinedAgentTemplateVersionRequestSchema,
      responseSchema: predefinedAgentTemplateVersionSchema,
      schemaName: 'PredefinedAgentTemplateVersionResponse',
      requestBody: payload,
    },
  );
}

export async function deletePredefinedAgentTemplate(
  templateId: string,
  context?: RequestContext,
): Promise<PredefinedTemplateDeleteResponse> {
  return apiFetchJson(
    `${adminBaseUrl}/agents/templates/${templateId}`,
    { method: 'DELETE' },
    {
      ...context,
      responseSchema: predefinedTemplateDeleteResponseSchema,
      schemaName: 'PredefinedAgentTemplateDeleteResponse',
    },
  );
}

export async function listPredefinedExternalToolTemplates(
  context?: RequestContext,
): Promise<PredefinedExternalToolTemplateListResponse> {
  return apiFetchJson(
    `${adminBaseUrl}/external-tools/templates`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: predefinedExternalToolTemplateListResponseSchema,
      schemaName: 'PredefinedExternalToolTemplateListResponse',
    },
  );
}

export async function createPredefinedExternalToolTemplate(
  payload: PredefinedExternalToolTemplateCreateRequest,
  context?: RequestContext,
): Promise<PredefinedExternalToolTemplateVersion> {
  validateRequestSchema(predefinedExternalToolTemplateCreateRequestSchema, payload, {
    url: `${adminBaseUrl}/external-tools/templates`,
    schemaName: 'PredefinedExternalToolTemplateCreateRequest',
  });
  return apiFetchJson(
    `${adminBaseUrl}/external-tools/templates`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: predefinedExternalToolTemplateCreateRequestSchema,
      responseSchema: predefinedExternalToolTemplateVersionSchema,
      schemaName: 'PredefinedExternalToolTemplateCreateResponse',
      requestBody: payload,
    },
  );
}

export async function publishPredefinedExternalToolTemplateVersion(
  templateId: string,
  payload: PredefinedExternalToolTemplateVersionRequest,
  context?: RequestContext,
): Promise<PredefinedExternalToolTemplateVersion> {
  validateRequestSchema(
    predefinedExternalToolTemplateVersionRequestSchema,
    payload,
    {
      url: `${adminBaseUrl}/external-tools/templates/${templateId}/versions`,
      schemaName: 'PredefinedExternalToolTemplateVersionRequest',
    },
  );
  return apiFetchJson(
    `${adminBaseUrl}/external-tools/templates/${templateId}/versions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: predefinedExternalToolTemplateVersionRequestSchema,
      responseSchema: predefinedExternalToolTemplateVersionSchema,
      schemaName: 'PredefinedExternalToolTemplateVersionResponse',
      requestBody: payload,
    },
  );
}

export async function deletePredefinedExternalToolTemplate(
  templateId: string,
  context?: RequestContext,
): Promise<PredefinedTemplateDeleteResponse> {
  return apiFetchJson(
    `${adminBaseUrl}/external-tools/templates/${templateId}`,
    { method: 'DELETE' },
    {
      ...context,
      responseSchema: predefinedTemplateDeleteResponseSchema,
      schemaName: 'PredefinedExternalToolTemplateDeleteResponse',
    },
  );
}

export async function listOrgPredefinedAgentTemplates(
  organizationId: string,
  context?: RequestContext,
): Promise<PredefinedAgentTemplateOrgListResponse> {
  return apiFetchJson(
    `${orgBaseUrl}/agents?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: predefinedAgentTemplateOrgListResponseSchema,
      schemaName: 'PredefinedAgentTemplateOrgListResponse',
    },
  );
}

export async function updateOrgPredefinedAgentTemplateState(
  organizationId: string,
  templateId: string,
  payload: PredefinedOrgStateUpdateRequest,
  context?: RequestContext,
): Promise<PredefinedOrgState> {
  validateRequestSchema(predefinedOrgStateUpdateRequestSchema, payload, {
    url: `${orgBaseUrl}/agents/${templateId}`,
    schemaName: 'PredefinedOrgStateUpdateRequest',
  });
  return apiFetchJson(
    `${orgBaseUrl}/agents/${templateId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: predefinedOrgStateUpdateRequestSchema,
      responseSchema: predefinedOrgStateSchema,
      schemaName: 'PredefinedOrgStateResponse',
      requestBody: payload,
    },
  );
}

export async function listOrgPredefinedExternalToolTemplates(
  organizationId: string,
  context?: RequestContext,
): Promise<PredefinedExternalToolTemplateOrgListResponse> {
  return apiFetchJson(
    `${orgBaseUrl}/external-tools?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: predefinedExternalToolTemplateOrgListResponseSchema,
      schemaName: 'PredefinedExternalToolTemplateOrgListResponse',
    },
  );
}

export async function updateOrgPredefinedExternalToolTemplateState(
  organizationId: string,
  templateId: string,
  payload: PredefinedOrgStateUpdateRequest,
  context?: RequestContext,
): Promise<PredefinedOrgState> {
  validateRequestSchema(predefinedOrgStateUpdateRequestSchema, payload, {
    url: `${orgBaseUrl}/external-tools/${templateId}`,
    schemaName: 'PredefinedOrgStateUpdateRequest',
  });
  return apiFetchJson(
    `${orgBaseUrl}/external-tools/${templateId}?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: predefinedOrgStateUpdateRequestSchema,
      responseSchema: predefinedOrgStateSchema,
      schemaName: 'PredefinedOrgStateResponse',
      requestBody: payload,
    },
  );
}
