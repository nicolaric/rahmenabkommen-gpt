import { apiFetchJson } from '@eos/data-access/shared';
import {
  billingSessionResponseSchema,
  billingSubscriptionChangeResponseSchema,
  type BillingSessionResponse,
  type BillingSubscriptionChangeResponse,
} from './billing.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/billing`;

export async function createCheckoutSession(
  priceId: string,
  organizationId: string,
): Promise<BillingSessionResponse> {
  const query = `price_id=${encodeURIComponent(priceId)}&organizationId=${organizationId}`;
  return apiFetchJson(
    `${baseUrl}/create-checkout-session?${query}`,
    { method: 'POST' },
    {
      responseSchema: billingSessionResponseSchema,
      schemaName: 'BillingSessionResponse',
    },
  );
}

export async function createPortalSession(
  organizationId: string,
): Promise<BillingSessionResponse> {
  return apiFetchJson(
    `${baseUrl}/create-portal-session?organizationId=${organizationId}`,
    { method: 'POST' },
    {
      responseSchema: billingSessionResponseSchema,
      schemaName: 'BillingSessionResponse',
    },
  );
}

export async function cancelSubscriptionAtPeriodEnd(
  organizationId: string,
): Promise<BillingSubscriptionChangeResponse> {
  return apiFetchJson(
    `${baseUrl}/cancel-subscription?organizationId=${organizationId}`,
    { method: 'POST' },
    {
      responseSchema: billingSubscriptionChangeResponseSchema,
      schemaName: 'BillingSubscriptionChangeResponse',
    },
  );
}

export async function scheduleSubscriptionDowngrade(
  priceId: string,
  organizationId: string,
): Promise<BillingSubscriptionChangeResponse> {
  const query = `price_id=${encodeURIComponent(priceId)}&organizationId=${organizationId}`;
  return apiFetchJson(
    `${baseUrl}/schedule-downgrade?${query}`,
    { method: 'POST' },
    {
      responseSchema: billingSubscriptionChangeResponseSchema,
      schemaName: 'BillingSubscriptionChangeResponse',
    },
  );
}
