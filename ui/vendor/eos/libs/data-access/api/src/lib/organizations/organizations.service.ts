import {
  apiFetch,
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  AdminOrganizationListResponse,
  OrganizationCreateRequest,
  OrganizationLocaleResponse,
  OrganizationLogoResponse,
  OrganizationResponse,
  OrganizationUpdateRequest,
} from './organizations.schemas';
import {
  adminOrganizationListResponseSchema,
  organizationCreateRequestSchema,
  organizationLocaleResponseSchema,
  organizationLogoResponseSchema,
  organizationResponseSchema,
  organizationUpdateRequestSchema,
  overageUsageResponseSchema,
} from './organizations.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/organizations`;

export async function listAdminOrganizations(
  options?: { sortBy?: string; sortOrder?: 'asc' | 'desc' },
  context?: RequestContext,
): Promise<AdminOrganizationListResponse> {
  const params = new URLSearchParams();
  if (options?.sortBy) params.set('sort_by', options.sortBy);
  if (options?.sortOrder) params.set('sort_order', options.sortOrder);
  const query = params.toString();

  return apiFetchJson(
    `${baseUrl}/admin${query ? `?${query}` : ''}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: adminOrganizationListResponseSchema,
      schemaName: 'AdminOrganizationListResponse',
    },
  );
}

export async function createOrganization(
  payload: OrganizationCreateRequest,
  context?: RequestContext,
  options?: { googleAdsClickId?: string | null; skipBilling?: boolean },
): Promise<OrganizationResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // Forward the Google Ads click ID so the backend can report the signup as a
  // conversion. Server-side callers must supply it explicitly because, unlike
  // client calls, they do not pass through the app-ui proxy that injects it.
  if (options?.googleAdsClickId) {
    headers['x-eos-google-ads-gclid'] = options.googleAdsClickId;
  }
  if (options?.skipBilling) {
    headers['x-yeos-skip-billing'] = 'true';
  }
  return apiFetchJson(
    baseUrl,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: organizationCreateRequestSchema,
      responseSchema: organizationResponseSchema,
      schemaName: 'OrganizationResponse',
      requestBody: payload,
    },
  );
}

export async function getOrganizationDefaultLocale(
  organizationId: string,
  context?: RequestContext,
): Promise<OrganizationLocaleResponse> {
  return apiFetchJson(
    `${baseUrl}/${organizationId}/default-locale?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: organizationLocaleResponseSchema,
      schemaName: 'OrganizationLocaleResponse',
    },
  );
}

export async function updateOrganizationDefaultLocale(
  organizationId: string,
  locale: 'en' | 'de' | null,
  context?: RequestContext,
): Promise<OrganizationLocaleResponse> {
  return apiFetchJson(
    `${baseUrl}/${organizationId}/default-locale?organizationId=${organizationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    },
    {
      ...context,
      responseSchema: organizationLocaleResponseSchema,
      schemaName: 'OrganizationLocaleResponse',
    },
  );
}

export async function updateOrganization(
  organizationId: string,
  payload: OrganizationUpdateRequest,
  context?: RequestContext,
): Promise<Response> {
  validateRequestSchema(organizationUpdateRequestSchema, payload, {
    url: `${baseUrl}/${organizationId}?organizationId=${organizationId}`,
    schemaName: 'OrganizationUpdateRequest',
  });
  return apiFetch(
    `${baseUrl}/${organizationId}?organizationId=${organizationId}`,
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

export async function getOverageUsage(
  organizationId: string,
  context?: RequestContext,
): Promise<Response> {
  return apiFetch(
    `${baseUrl}/${organizationId}/overage-usage?organizationId=${organizationId}`,
    { method: 'GET' },
    {
      ...context,
      responseSchema: overageUsageResponseSchema,
      schemaName: 'OverageUsageResponse',
    },
  );
}

export async function deleteOrganization(
  organizationId: string,
  context?: RequestContext,
): Promise<Response> {
  return apiFetch(
    `${baseUrl}/${organizationId}`,
    { method: 'DELETE' },
    context,
  );
}

/**
 * Build the URL an organization's logo is served from.
 *
 * The content hash is part of the path, so the bytes behind a given URL never
 * change and the response can be cached for a long time. A new logo produces a
 * new URL rather than requiring anything to be invalidated.
 */
export function organizationLogoUrl(
  organizationId: string,
  contentHash: string,
): string {
  return `${baseUrl}/${organizationId}/logo/${contentHash}.png?organizationId=${organizationId}`;
}

export async function uploadOrganizationLogo(
  organizationId: string,
  logo: Blob,
  context?: RequestContext,
): Promise<OrganizationLogoResponse> {
  const body = new FormData();
  body.append('logo', logo, 'logo.png');

  // No Content-Type header: fetch derives the multipart boundary from FormData,
  // and setting it manually would omit the boundary and break parsing.
  return apiFetchJson(
    `${baseUrl}/${organizationId}/logo?organizationId=${organizationId}`,
    { method: 'PUT', body },
    {
      ...context,
      responseSchema: organizationLogoResponseSchema,
      schemaName: 'OrganizationLogoResponse',
    },
  );
}

export async function deleteOrganizationLogo(
  organizationId: string,
  context?: RequestContext,
): Promise<Response> {
  return apiFetch(
    `${baseUrl}/${organizationId}/logo?organizationId=${organizationId}`,
    { method: 'DELETE' },
    context,
  );
}
