import {
  apiFetch,
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  addWorkspaceMembersRequestSchema,
  addWorkspaceMembersResponseSchema,
  createWorkspaceRequestSchema,
  disableWorkspaceResponseSchema,
  enableWorkspaceResponseSchema,
  removeWorkspaceMemberResponseSchema,
  updateWorkspaceMemberRoleRequestSchema,
  updateWorkspaceMemberRoleResponseSchema,
  updateWorkspaceRequestSchema,
  workspaceListResponseSchema,
  workspaceMemberListResponseSchema,
  workspaceSchema,
} from './workspaces.schemas';
import type {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResponse,
  CreateWorkspaceRequest,
  DisableWorkspaceResponse,
  EnableWorkspaceResponse,
  RemoveWorkspaceMemberResponse,
  UpdateWorkspaceMemberRoleRequest,
  UpdateWorkspaceMemberRoleResponse,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceListResponse,
  WorkspaceMemberListResponse,
} from './workspaces.schemas';
import { buildContextUrl } from '../context/context';

const baseUrl = `${import.meta.env.VITE_API_URL}/workspaces`;

export async function listWorkspaces(
  organizationId: string,
  context?: RequestContext,
): Promise<WorkspaceListResponse> {
  return apiFetchJson(
    buildContextUrl(baseUrl, organizationId),
    {},
    {
      ...context,
      responseSchema: workspaceListResponseSchema,
      schemaName: 'WorkspaceListResponse',
    },
  );
}

export async function getWorkspace(
  organizationId: string,
  workspaceId: string,
  context?: RequestContext,
): Promise<Workspace> {
  return apiFetchJson(
    buildContextUrl(`${baseUrl}/${workspaceId}`, organizationId),
    {},
    {
      ...context,
      responseSchema: workspaceSchema,
      schemaName: 'WorkspaceResponse',
    },
  );
}

export async function createWorkspace(
  organizationId: string,
  payload: CreateWorkspaceRequest,
  context?: RequestContext,
): Promise<Workspace> {
  validateRequestSchema(createWorkspaceRequestSchema, payload, {
    url: buildContextUrl(baseUrl, organizationId),
    schemaName: 'CreateWorkspaceRequest',
  });

  return apiFetchJson(
    buildContextUrl(baseUrl, organizationId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: createWorkspaceRequestSchema,
      responseSchema: workspaceSchema,
      schemaName: 'WorkspaceResponse',
      requestBody: payload,
    },
  );
}

export async function updateWorkspace(
  organizationId: string,
  workspaceId: string,
  payload: UpdateWorkspaceRequest,
  context?: RequestContext,
): Promise<Response> {
  validateRequestSchema(updateWorkspaceRequestSchema, payload, {
    url: buildContextUrl(`${baseUrl}/${workspaceId}`, organizationId),
    schemaName: 'UpdateWorkspaceRequest',
  });

  return apiFetch(
    buildContextUrl(`${baseUrl}/${workspaceId}`, organizationId),
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    context,
  );
}

export async function disableWorkspace(
  organizationId: string,
  workspaceId: string,
  context?: RequestContext,
): Promise<DisableWorkspaceResponse> {
  return apiFetchJson(
    buildContextUrl(`${baseUrl}/${workspaceId}/disable`, organizationId),
    {
      method: 'POST',
    },
    {
      ...context,
      responseSchema: disableWorkspaceResponseSchema,
      schemaName: 'DisableWorkspaceResponse',
    },
  );
}

export async function enableWorkspace(
  organizationId: string,
  workspaceId: string,
  context?: RequestContext,
): Promise<EnableWorkspaceResponse> {
  return apiFetchJson(
    buildContextUrl(`${baseUrl}/${workspaceId}/enable`, organizationId),
    {
      method: 'POST',
    },
    {
      ...context,
      responseSchema: enableWorkspaceResponseSchema,
      schemaName: 'EnableWorkspaceResponse',
    },
  );
}

export async function deleteWorkspace(
  organizationId: string,
  workspaceId: string,
  context?: RequestContext,
): Promise<Response> {
  return apiFetch(
    buildContextUrl(`${baseUrl}/${workspaceId}`, organizationId),
    {
      method: 'DELETE',
    },
    context,
  );
}

export async function listWorkspaceMembers(
  organizationId: string,
  workspaceId: string,
  context?: RequestContext,
): Promise<WorkspaceMemberListResponse> {
  return apiFetchJson(
    buildContextUrl(`${baseUrl}/${workspaceId}/members`, organizationId),
    {},
    {
      ...context,
      responseSchema: workspaceMemberListResponseSchema,
      schemaName: 'WorkspaceMemberListResponse',
    },
  );
}

export async function addWorkspaceMembers(
  organizationId: string,
  workspaceId: string,
  payload: AddWorkspaceMembersRequest,
  context?: RequestContext,
): Promise<AddWorkspaceMembersResponse> {
  validateRequestSchema(addWorkspaceMembersRequestSchema, payload, {
    url: buildContextUrl(`${baseUrl}/${workspaceId}/members`, organizationId),
    schemaName: 'AddWorkspaceMembersRequest',
  });

  return apiFetchJson(
    buildContextUrl(`${baseUrl}/${workspaceId}/members`, organizationId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: addWorkspaceMembersRequestSchema,
      responseSchema: addWorkspaceMembersResponseSchema,
      schemaName: 'AddWorkspaceMembersResponse',
      requestBody: payload,
    },
  );
}

export async function removeWorkspaceMember(
  organizationId: string,
  workspaceId: string,
  identityId: string,
  context?: RequestContext,
): Promise<RemoveWorkspaceMemberResponse> {
  return apiFetchJson(
    buildContextUrl(
      `${baseUrl}/${workspaceId}/members/${identityId}`,
      organizationId,
    ),
    {
      method: 'DELETE',
    },
    {
      ...context,
      responseSchema: removeWorkspaceMemberResponseSchema,
      schemaName: 'RemoveWorkspaceMemberResponse',
    },
  );
}

export async function updateWorkspaceMemberRole(
  organizationId: string,
  workspaceId: string,
  identityId: string,
  payload: UpdateWorkspaceMemberRoleRequest,
  context?: RequestContext,
): Promise<UpdateWorkspaceMemberRoleResponse> {
  validateRequestSchema(updateWorkspaceMemberRoleRequestSchema, payload, {
    url: buildContextUrl(
      `${baseUrl}/${workspaceId}/members/${identityId}/role`,
      organizationId,
    ),
    schemaName: 'UpdateWorkspaceMemberRoleRequest',
  });

  return apiFetchJson(
    buildContextUrl(
      `${baseUrl}/${workspaceId}/members/${identityId}/role`,
      organizationId,
    ),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: updateWorkspaceMemberRoleRequestSchema,
      responseSchema: updateWorkspaceMemberRoleResponseSchema,
      schemaName: 'UpdateWorkspaceMemberRoleResponse',
      requestBody: payload,
    },
  );
}
