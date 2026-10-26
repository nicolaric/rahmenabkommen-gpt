import { z } from 'zod';

export const conversationSignalKindSchema = z.enum([
  'decision',
  'commitment',
  'stated_fact',
  'outcome_observation',
  'open_question',
  'potential_learning',
  'contradiction_signal',
]);

export const conversationSignalOriginSchema = z.enum([
  'user_message',
  'assistant_message',
  'tool_result',
  'mixed',
  'document',
]);

export const conversationSignalSourceKindSchema = z.enum([
  'message',
  'document',
  'generated',
]);

export const conversationSignalStatusSchema = z.enum([
  'detected',
  'dismissed',
  'linked',
  'failed',
]);

export const conversationSignalSchema = z.object({
  id: z.string().uuid(),
  message_id: z.string().uuid().nullable(),
  conversation_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  signal_kind: conversationSignalKindSchema,
  extracted_content: z.string(),
  confidence: z.number().min(0).max(1),
  origin: conversationSignalOriginSchema,
  detector_version: z.string(),
  status: conversationSignalStatusSchema,
  initiative_id: z.string().uuid().nullable(),
  project_deliverable_revision_id: z.string().uuid().nullable(),
  detector_metadata: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  effective_at: z.string().nullable(),
  dismissed_at: z.string().nullable(),
  linked_at: z.string().nullable(),
  source_kind: conversationSignalSourceKindSchema,
  source_question: z.string().nullable(),
  source_answer: z.string().nullable(),
  source_file_id: z.string().uuid().nullable(),
  source_chunk_index: z.number().int().nullable(),
  source_page_number: z.number().int().nullable(),
  source_quote: z.string().nullable(),
});

export type ConversationSignal = z.infer<typeof conversationSignalSchema>;

export const conversationSignalLinkRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  initiative_id: z.string().uuid(),
  project_deliverable_id: z.string().uuid(),
  project_deliverable_revision_id: z.string().uuid(),
});

export type ConversationSignalLinkRequest = z.infer<
  typeof conversationSignalLinkRequestSchema
>;

export const initiativeDraftStatusSchema = z.enum([
  'pending',
  'approved',
  'published',
  'dismissed',
  'failed',
]);

export const initiativeDraftSchema = z.object({
  id: z.string().uuid(),
  conversation_signal_id: z.string().uuid(),
  message_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  title: z.string(),
  objective: z.string(),
  scope: z.string(),
  evidence_summary: z.string(),
  generation_metadata: z.record(z.string(), z.unknown()).default({}),
  applicability_conditions: z.array(z.string()),
  limitations: z.array(z.string()),
  status: initiativeDraftStatusSchema,
  approved_by: z.string().nullable(),
  approved_at: z.string().nullable(),
  dismissed_by: z.string().nullable(),
  dismissed_at: z.string().nullable(),
  resulting_initiative_id: z.string().uuid().nullable(),
  resulting_deliverable_id: z.string().uuid().nullable(),
  failure_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type InitiativeDraft = z.infer<typeof initiativeDraftSchema>;

export const initiativeDraftUpdateRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  objective: z.string().min(1).max(10_000).optional(),
  scope: z.string().min(1).max(10_000).optional(),
});

export type InitiativeDraftUpdateRequest = z.infer<
  typeof initiativeDraftUpdateRequestSchema
>;
