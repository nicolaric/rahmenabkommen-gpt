import { z } from 'zod';

export const automationStatusSchema = z.enum(['active', 'paused', 'archived']);
export const automationApprovalPolicySchema = z.enum([
  'none',
  'external_actions',
  'all_actions',
]);
export const automationTriggerTypeSchema = z.enum([
  'manual',
  'schedule',
  'webhook',
  'event',
]);
export const automationTriggerStatusSchema = z.enum([
  'active',
  'paused',
  'archived',
]);
export const automationRunStatusSchema = z.enum([
  'queued',
  'running',
  'waiting',
  'approval_required',
  'completed',
  'failed',
  'skipped',
  'cancelled',
]);
export const automationRunEventTypeSchema = z.enum([
  'trigger_received',
  'run_queued',
  'run_started',
  'model_turn',
  'tool_call_started',
  'tool_call_finished',
  'approval_requested',
  'approval_decided',
  'wait_started',
  'continuation_queued',
  'run_completed',
  'run_failed',
  'run_cancelled',
  'error',
]);

const jsonObjectSchema = z.record(z.string(), z.unknown());

export const automationSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  workspace_id: z.string().nullable(),
  agent_id: z.string(),
  owner_identity_id: z.string().nullable(),
  name: z.string(),
  instruction: z.string(),
  status: automationStatusSchema,
  approval_policy: automationApprovalPolicySchema,
  notification_settings: jsonObjectSchema,
  next_run_at: z.string().nullable(),
  last_run_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Automation = z.infer<typeof automationSchema>;

export const automationListResponseSchema = z.object({
  data: z.array(automationSchema),
  count: z.number(),
});
export type AutomationListResponse = z.infer<typeof automationListResponseSchema>;

export const automationTriggerSchema = z.object({
  id: z.string(),
  automation_id: z.string(),
  trigger_type: automationTriggerTypeSchema,
  config: jsonObjectSchema,
  status: automationTriggerStatusSchema,
  next_run_at: z.string().nullable(),
  last_triggered_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AutomationTrigger = z.infer<typeof automationTriggerSchema>;

export const automationTriggerListResponseSchema = z.object({
  data: z.array(automationTriggerSchema),
  count: z.number(),
});
export type AutomationTriggerListResponse = z.infer<
  typeof automationTriggerListResponseSchema
>;

export const automationTriggerCreatedResponseSchema = z.object({
  trigger: automationTriggerSchema,
  webhook_token: z.string().nullable(),
  webhook_secret: z.string().nullable(),
});
export type AutomationTriggerCreatedResponse = z.infer<
  typeof automationTriggerCreatedResponseSchema
>;

export const webhookTriggerTokenResponseSchema = z.object({
  webhook_token: z.string(),
});
export type WebhookTriggerTokenResponse = z.infer<
  typeof webhookTriggerTokenResponseSchema
>;

export const automationRunSchema = z.object({
  id: z.string(),
  workspace_id: z.string().nullable(),
  automation_id: z.string().nullable(),
  trigger_id: z.string().nullable(),
  agent_id: z.string().nullable(),
  conversation_id: z.string().nullable(),
  trigger_type: automationTriggerTypeSchema,
  status: automationRunStatusSchema,
  scheduled_for: z.string().nullable(),
  version: z.number(),
  failure_message: z.string().nullable(),
  started_at: z.string().nullable(),
  waiting_until: z.string().nullable(),
  finished_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AutomationRun = z.infer<typeof automationRunSchema>;

export const automationRunPageResponseSchema = z.object({
  data: z.array(automationRunSchema),
  next_cursor: z.string().nullable(),
});
export type AutomationRunPageResponse = z.infer<
  typeof automationRunPageResponseSchema
>;

export const automationRunEventSchema = z.object({
  id: z.number(),
  run_id: z.string(),
  event_type: automationRunEventTypeSchema,
  summary: z.string(),
  payload: jsonObjectSchema,
  created_at: z.string(),
});
export type AutomationRunEvent = z.infer<typeof automationRunEventSchema>;

export const automationRunEventPageResponseSchema = z.object({
  data: z.array(automationRunEventSchema),
  next_after_id: z.number().nullable(),
});
export type AutomationRunEventPageResponse = z.infer<
  typeof automationRunEventPageResponseSchema
>;

export const automationCreateRequestSchema = z.object({
  agent_id: z.string(),
  name: z.string().min(1).max(100),
  instruction: z.string().min(1).max(4000),
  workspace_id: z.string().nullable().optional(),
  approval_policy: automationApprovalPolicySchema.optional(),
  notification_settings: jsonObjectSchema.optional(),
});
export type AutomationCreateRequest = z.infer<
  typeof automationCreateRequestSchema
>;

export const automationUpdateRequestSchema = z.object({
  agent_id: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  instruction: z.string().min(1).max(4000).optional(),
  workspace_id: z.string().nullable().optional(),
  approval_policy: automationApprovalPolicySchema.optional(),
  notification_settings: jsonObjectSchema.optional(),
});
export type AutomationUpdateRequest = z.infer<
  typeof automationUpdateRequestSchema
>;

export const automationStatusRequestSchema = z.object({
  status: automationStatusSchema,
});
export type AutomationStatusRequest = z.infer<
  typeof automationStatusRequestSchema
>;

export const automationTriggerCreateRequestSchema = z.object({
  trigger_type: automationTriggerTypeSchema,
  config: jsonObjectSchema.optional(),
});
export type AutomationTriggerCreateRequest = z.infer<
  typeof automationTriggerCreateRequestSchema
>;

export const automationTriggerUpdateRequestSchema = z.object({
  config: jsonObjectSchema.optional(),
  status: automationTriggerStatusSchema.optional(),
});
export type AutomationTriggerUpdateRequest = z.infer<
  typeof automationTriggerUpdateRequestSchema
>;

export const manualAutomationInvocationRequestSchema = z.object({
  context: jsonObjectSchema.optional(),
});
export type ManualAutomationInvocationRequest = z.infer<
  typeof manualAutomationInvocationRequestSchema
>;
