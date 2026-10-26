import {
  apiFetch,
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  addMembersRequestSchema,
  memberResponseSchema,
  updateMemberRoleRequestSchema,
} from './members.schemas';
import type {
  AddMembersRequest,
  MemberResponse,
  UpdateMemberRoleRequest,
} from './members.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/organizations/members`;

export async function listMembers(
  organizationId: string,
  request: Request,
  pagination: { page: number; pageSize: number },
): Promise<MemberResponse> {
  return apiFetchJson(
    `${baseUrl}?organizationId=${organizationId}&page_size=${pagination.pageSize}&page=${pagination.page}`,
    {},
    {
      request,
      responseSchema: memberResponseSchema,
      schemaName: 'MemberResponse',
    },
  );
}

export async function addMembers(
  organizationId: string,
  payload: AddMembersRequest,
): Promise<Response> {
  validateRequestSchema(addMembersRequestSchema, payload, {
    url: `${baseUrl}?organizationId=${organizationId}`,
    schemaName: 'AddMembersRequest',
  });
  return apiFetch(`${baseUrl}?organizationId=${organizationId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function removeMember(
  memberId: string,
  organizationId: string,
): Promise<Response> {
  return apiFetch(`${baseUrl}/${memberId}?organizationId=${organizationId}`, {
    method: 'DELETE',
  });
}

export async function leaveOrganization(
  organizationId: string,
  context?: RequestContext,
): Promise<Response> {
  return apiFetch(
    `${baseUrl}/me?organizationId=${organizationId}`,
    {
      method: 'DELETE',
    },
    context,
  );
}

export async function updateMemberRole(
  memberId: string,
  organizationId: string,
  payload: UpdateMemberRoleRequest,
): Promise<Response> {
  validateRequestSchema(updateMemberRoleRequestSchema, payload, {
    url: `${baseUrl}/${memberId}/role?organizationId=${organizationId}`,
    schemaName: 'UpdateMemberRoleRequest',
  });
  return apiFetch(
    `${baseUrl}/${memberId}/role?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
}
