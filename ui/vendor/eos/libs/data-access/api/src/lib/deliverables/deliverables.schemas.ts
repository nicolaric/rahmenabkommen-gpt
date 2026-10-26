import { z } from 'zod';

export const strategyEvidenceItemSchema = z.object({
  statement: z.string().min(1),
  source_title: z.string().min(1),
  source_reference_id: z.string().uuid().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
});

export const strategyOptionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  trade_offs: z.array(z.string()),
});

export const strategyMilestoneSchema = z.object({
  name: z.string().min(1),
  outcome: z.string().min(1),
  timing: z.string().nullable().optional(),
});

export const strategyFirstActionSchema = z.object({
  action: z.string().min(1),
  owner: z.string().nullable().optional(),
});

export const decisionExecutionStrategySchema = z.object({
  objective: z.string().min(1),
  success_metric: z.string().min(1),
  evidence: z.array(strategyEvidenceItemSchema),
  assumptions: z.array(z.string()),
  options: z.array(strategyOptionSchema),
  recommendation: z.string().min(1),
  constraints_and_bottlenecks: z.array(z.string()),
  risks: z.array(z.string()),
  milestones: z.array(strategyMilestoneSchema),
  first_actions: z.array(strategyFirstActionSchema),
  open_questions: z.array(z.string()),
});

export type DecisionExecutionStrategy = z.infer<
  typeof decisionExecutionStrategySchema
>;

export const deliverableInputSnapshotSchema = z.object({
  research_pack_id: z.string().uuid(),
  research_run_id: z.string().uuid().nullable().optional(),
  question: z.string(),
  objective: z.string(),
  findings: z.array(z.record(z.string(), z.unknown())),
  knowledge_gaps: z.array(z.record(z.string(), z.unknown())),
});

export const projectDeliverableSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  initiative_id: z.string().uuid(),
  template_key: z.literal('decision-execution-strategy'),
  status: z.enum(['draft', 'generating', 'failed']),
  current_revision_id: z.string().uuid().nullable(),
  error_code: z.string().nullable().default(null),
  error_message: z.string().nullable().default(null),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProjectDeliverable = z.infer<typeof projectDeliverableSchema>;

export const strategyFollowUpSchema = z.object({
  id: z.string().uuid(),
  project_deliverable_id: z.string().uuid(),
  source_revision_id: z.string().uuid(),
  question: z.string().min(1),
  rationale: z.string().min(1),
  priority: z.enum(['blocking', 'useful', 'optional']),
  expected_answer_format: z.string(),
  status: z.enum(['open', 'asked', 'answered', 'deferred', 'dismissed']),
  answer_snapshot: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type StrategyFollowUp = z.infer<typeof strategyFollowUpSchema>;

export const strategyFollowUpStatusRequestSchema = z.object({
  status: z.enum(['deferred', 'dismissed']),
});

export type StrategyFollowUpStatusRequest = z.infer<
  typeof strategyFollowUpStatusRequestSchema
>;

export const strategyFollowUpAnswerRequestSchema = z
  .object({
    answer: z.string().min(1).optional(),
    document_id: z.string().uuid().optional(),
  })
  .refine((value) => value.answer || value.document_id, {
    message: 'Provide an answer or select a document',
  });

export const deliverableDocumentEvidenceReferenceSchema = z.object({
  snapshot_id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  source_document_version: z.number().int().positive(),
  source_content_hash: z.string(),
  source_name: z.string(),
  location: z.record(z.string(), z.unknown()).default({}),
  retrieval_score: z.number(),
});

export const projectDeliverableRevisionSchema = z.object({
  id: z.string().uuid(),
  project_deliverable_id: z.string().uuid(),
  revision_number: z.number().int().positive(),
  source_type: z.enum(['user', 'generation']),
  content: decisionExecutionStrategySchema,
  initiative_brief_snapshot: z.record(z.string(), z.unknown()),
  research_input_snapshots: z.array(deliverableInputSnapshotSchema),
  learning_input_snapshots: z
    .array(z.record(z.string(), z.unknown()))
    .default([]),
  document_evidence_snapshot_refs: deliverableDocumentEvidenceReferenceSchema
    .array()
    .default([]),
  generation_metadata: z.record(z.string(), z.unknown()).default({}),
  evidence_readiness: z
    .enum(['ready', 'provisional', 'legacy'])
    .default('legacy'),
  created_by: z.string().nullable(),
  created_at: z.string(),
});

export type ProjectDeliverableRevision = z.infer<
  typeof projectDeliverableRevisionSchema
>;

export const projectDeliverableListSchema = z.object({
  data: z.array(projectDeliverableSchema),
  count: z.number().int().nonnegative(),
});

export type ProjectDeliverableList = z.infer<
  typeof projectDeliverableListSchema
>;

export const projectDeliverableCreateRequestSchema = z.object({
  initiative_id: z.string().uuid(),
  research_pack_ids: z.array(z.string().uuid()).min(1),
  learning_signal_ids: z.array(z.string().uuid()).optional(),
  workspace_id: z.string().uuid().nullable().optional(),
  strategy: decisionExecutionStrategySchema,
});

export type ProjectDeliverableCreateRequest = z.infer<
  typeof projectDeliverableCreateRequestSchema
>;

export const projectDeliverableRevisionCreateRequestSchema = z.object({
  strategy: decisionExecutionStrategySchema,
});

export type ProjectDeliverableRevisionCreateRequest = z.infer<
  typeof projectDeliverableRevisionCreateRequestSchema
>;

export const deliverableReleaseSchema = z.object({
  id: z.string().uuid(),
  project_deliverable_id: z.string().uuid(),
  project_deliverable_revision_id: z.string().uuid(),
  released_by: z.string().nullable(),
  actor_type: z.string().default('user'),
  generation_metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
});

export type DeliverableRelease = z.infer<typeof deliverableReleaseSchema>;

export const deliverableEvaluationCritiqueSchema = z.object({
  affected_section: z.string().min(1),
  rationale: z.string().min(1),
  suggested_improvement: z.string().min(1),
  limitation: z.string().nullable().optional(),
});

export const deliverableEvaluationSchema = z.object({
  id: z.string().uuid(),
  project_deliverable_id: z.string().uuid(),
  project_deliverable_revision_id: z.string().uuid(),
  requested_by: z.string().nullable(),
  status: z.enum(['queued', 'running', 'completed', 'failed']),
  rubric_version: z.string(),
  critiques: z.array(deliverableEvaluationCritiqueSchema),
  limitations: z.array(z.string()),
  error_message: z.string().nullable(),
  created_at: z.string(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export type DeliverableEvaluation = z.infer<typeof deliverableEvaluationSchema>;

export const deliverableEvaluationRequestSchema = z.object({
  rubric_version: z.string().min(1).optional(),
});

export type DeliverableEvaluationRequest = z.infer<
  typeof deliverableEvaluationRequestSchema
>;

export const deliverableMeasurementIntentRequestSchema = z.object({
  outcome_definition: z.string().min(1),
});

export type DeliverableMeasurementIntentRequest = z.infer<
  typeof deliverableMeasurementIntentRequestSchema
>;

const deliverableMeasurementStatusSchema = z.enum([
  'pending',
  'collecting',
  'available',
  'unavailable',
  'insufficient_data',
  'failed',
]);

export const deliverableMeasurementSelectionSchema = z.object({
  tool_key: z.string().nullable(),
  catalog_version: z.string(),
  status: deliverableMeasurementStatusSchema,
  rationale: z.string().nullable(),
  error_message: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export const deliverableOutcomeSourceSnapshotSchema = z.object({
  source_tool_key: z.string(),
  source_event_id: z.string(),
  snapshot: z.record(z.string(), z.unknown()),
  captured_at: z.string(),
});

export const deliverableOutcomeObservationSchema = z.object({
  id: z.string().uuid(),
  metric_key: z.string(),
  metric_definition: z.string(),
  value: z.number(),
  denominator: z.number().nullable(),
  window_started_at: z.string(),
  window_ended_at: z.string(),
  attribution_context: z.record(z.string(), z.unknown()),
  collected_at: z.string(),
  source: deliverableOutcomeSourceSnapshotSchema.nullable(),
});

export const deliverableOutcomeScorecardSchema = z.object({
  id: z.string().uuid(),
  measurement_intent_id: z.string().uuid(),
  project_deliverable_revision_id: z.string().uuid(),
  outcome_definition: z.string(),
  status: deliverableMeasurementStatusSchema,
  selection: deliverableMeasurementSelectionSchema.nullable(),
  observations: z.array(deliverableOutcomeObservationSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

export type DeliverableOutcomeScorecard = z.infer<
  typeof deliverableOutcomeScorecardSchema
>;
