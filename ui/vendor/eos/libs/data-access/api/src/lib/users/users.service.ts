import {
  apiFetch,
  apiFetchJson,
  RequestContext,
} from '@eos/data-access/shared';
import type {
  AdminUserListResponse,
  EffectiveLocaleResponse,
  MfaStatusResponse,
  UpdateProfileRequest,
  ProfileResponse,
} from './users.schemas';
import {
  adminUserListResponseSchema,
  effectiveLocaleResponseSchema,
  mfaStatusResponseSchema,
  profileResponseSchema,
} from './users.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/users`;

export async function listAdminUsers(
  context?: RequestContext,
  options?: {
    page?: number;
    pageSize?: number;
    pageToken?: string;
    organizationId?: string;
  },
): Promise<AdminUserListResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.pageSize) params.set('page_size', String(options.pageSize));
  if (options?.pageToken) params.set('page_token', options.pageToken);
  if (options?.organizationId) {
    params.set('organization_id', options.organizationId);
  }
  const query = params.toString();

  return apiFetchJson(
    `${baseUrl}/admin${query ? `?${query}` : ''}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: adminUserListResponseSchema,
      schemaName: 'AdminUserListResponse',
    },
  );
}

/**
 * Fetch the current user's profile.
 */
export async function getProfile(
  context?: RequestContext,
): Promise<ProfileResponse> {
  return apiFetchJson(
    `${baseUrl}/me/profile`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    {
      ...context,
      responseSchema: profileResponseSchema,
      schemaName: 'ProfileResponse',
    },
  );
}

/**
 * Update the current user's first and last name.
 */
export async function updateProfile(
  payload: UpdateProfileRequest,
  context?: RequestContext,
): Promise<ProfileResponse> {
  return apiFetchJson(
    `${baseUrl}/me/profile`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: profileResponseSchema,
      schemaName: 'ProfileResponse',
    },
  );
}

/**
 * Second factors the current user has set up, and whether the app should
 * suggest setting one up now.
 */
export async function getMfaStatus(
  context?: RequestContext,
): Promise<MfaStatusResponse> {
  return apiFetchJson(
    `${baseUrl}/me/mfa`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: mfaStatusResponseSchema,
      schemaName: 'MfaStatusResponse',
    },
  );
}

/**
 * Hide the two-factor setup suggestion for a while.
 */
export async function dismissMfaPrompt(
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    `${baseUrl}/me/mfa/prompt-dismissal`,
    { method: 'POST' },
    context,
  );
  if (!response.ok) {
    const error = new Error(
      `Dismiss MFA prompt failed: HTTP ${response.status}`,
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
}

/**
 * The language the app should use for the current user: their own choice,
 * else the organization's default, else null (the client decides).
 */
export async function getEffectiveLocale(
  organizationId: string | undefined,
  context?: RequestContext,
): Promise<EffectiveLocaleResponse> {
  const query = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : '';
  return apiFetchJson(
    `${baseUrl}/me/locale${query}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: effectiveLocaleResponseSchema,
      schemaName: 'EffectiveLocaleResponse',
    },
  );
}
