import { z } from 'zod';

const sourceSelectionSchema = z.object({
  context_entry_ids: z.array(z.string().uuid()),
  document_ids: z.array(z.string().uuid()),
  user_material: z.array(z.string()),
  connected_tool_ids: z.array(z.string().uuid()),
});

const evidenceReferenceSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  finding_key: z.string().nullable().optional(),
  source_type: z.enum([
    'organization_context',
    'document',
    'user_material',
    'connected_tool',
  ]),
  source_id: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  title: z.string(),
  provenance: z.string(),
  snapshot: z.record(z.string(), z.unknown()).nullable().optional(),
  content_hash: z.string().nullable().optional(),
  retrieved_at: z.string(),
});

const findingSchema = z.object({
  key: z.string(),
  statement: z.string(),
  classification: z.enum(['evidence', 'inference', 'assumption']),
  caveat: z.string().nullable().optional(),
  confidence: z.string().nullable().optional(),
  evidence_references: z.array(evidenceReferenceSchema),
});

const knowledgeGapSchema = z.object({
  question: z.string(),
  reason: z.string(),
  suggested_follow_up: z.string().nullable().optional(),
});

export const researchPackSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  initiative_id: z.string().uuid().nullable(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
  question: z.string(),
  objective: z.string(),
  status: z.enum(['draft', 'running', 'failed']),
  source_selection: sourceSelectionSchema,
  findings: z.array(findingSchema),
  knowledge_gaps: z.array(knowledgeGapSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ResearchPack = z.infer<typeof researchPackSchema>;

export const researchPackListSchema = z.object({
  data: z.array(researchPackSchema),
  count: z.number(),
});

export type ResearchPackList = z.infer<typeof researchPackListSchema>;

export const researchPackCreateRequestSchema = z.object({
  question: z.string().min(1),
  objective: z.string().min(1),
  workspace_id: z.string().uuid().nullable().optional(),
  initiative_id: z.string().uuid().nullable().optional(),
  source_selection: sourceSelectionSchema,
});

export type ResearchPackCreateRequest = z.infer<
  typeof researchPackCreateRequestSchema
>;

export const researchPackUpdateRequestSchema = z.object({
  question: z.string().min(1).optional(),
  objective: z.string().min(1).optional(),
  findings: z.array(findingSchema).optional(),
  knowledge_gaps: z.array(knowledgeGapSchema).optional(),
});

export type ResearchPackUpdateRequest = z.infer<
  typeof researchPackUpdateRequestSchema
>;

export const researchRunSchema = z.object({
  id: z.string().uuid(),
  research_pack_id: z.string().uuid(),
  status: z.enum(['running', 'completed', 'failed']),
  confirmed_request: z.record(z.string(), z.unknown()),
  error_message: z.string().nullable(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  evidence_references: z.array(evidenceReferenceSchema),
});

export type ResearchRun = z.infer<typeof researchRunSchema>;

export const researchRunListSchema = z.object({
  data: z.array(researchRunSchema),
  count: z.number(),
});

export const researchSuggestionRequestSchema = z.object({
  trigger_type: z.enum(['context_entry', 'document']),
  trigger_id: z.string().uuid(),
  question: z.string().min(1),
  objective: z.string().min(1),
});

export type ResearchSuggestionRequest = z.infer<
  typeof researchSuggestionRequestSchema
>;

export const researchSuggestionSchema = z.object({
  trigger_type: z.enum(['context_entry', 'document']),
  trigger_id: z.string().uuid(),
  question: z.string(),
  objective: z.string(),
  explanation: z.string(),
  persisted: z.literal(false),
});

export type ResearchSuggestion = z.infer<typeof researchSuggestionSchema>;
