import { z } from 'zod';

export const billingSessionResponseSchema = z.object({
  url: z.string(),
});

export const billingSubscriptionChangeResponseSchema = z.object({
  status: z.string(),
  current_period_end: z.number().nullable().optional(),
  cancel_at_period_end: z.boolean().optional(),
  target_plan: z.string().nullable().optional(),
});

export type BillingSessionResponse = z.infer<
  typeof billingSessionResponseSchema
>;

export type BillingSubscriptionChangeResponse = z.infer<
  typeof billingSubscriptionChangeResponseSchema
>;
