import { z } from 'zod';

export const brainItemTypeSchema = z.enum([
  'signal',
  'decision',
  'knowledge_gap',
  'initiative',
  'deliverable',
  'outcome',
]);

export const brainDocumentEvidenceSummarySchema = z.object({
  id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  source_document_version: z.number().int().positive(),
  source_content_hash: z.string(),
  source_name: z.string(),
  source_url: z.string().nullable().optional(),
  location_metadata: z.record(z.string(), z.unknown()).default({}),
  citation_metadata: z.record(z.string(), z.unknown()).default({}),
  retrieval_score: z.number(),
  retrieved_at: z.string(),
});

export type BrainDocumentEvidenceSummary = z.infer<
  typeof brainDocumentEvidenceSummarySchema
>;

export const brainDocumentEvidenceSchema =
  brainDocumentEvidenceSummarySchema.extend({
    organization_id: z.string().uuid(),
    workspace_id: z.string().uuid().nullable(),
    conversation_signal_id: z.string().uuid(),
    request_key: z.string(),
    excerpt: z.string(),
    excerpt_hash: z.string(),
  });

export type BrainDocumentEvidence = z.infer<typeof brainDocumentEvidenceSchema>;

export const brainRetrievalAttemptSchema = z.object({
  id: z.string().uuid(),
  conversation_signal_id: z.string().uuid(),
  status: z.enum(['pending', 'completed', 'no_result', 'truncated', 'failed']),
  result_count: z.number().int().nonnegative(),
  truncated: z.boolean(),
  limitations: z.array(z.string()).default([]),
  error_code: z.string().nullable().optional(),
  retry_count: z.number().int().nonnegative(),
  updated_at: z.string(),
});

export type BrainRetrievalAttempt = z.infer<typeof brainRetrievalAttemptSchema>;

/** A member or synced-source person who said or uploaded a Brain item's source. */
export const brainItemPersonSchema = z.object({
  kind: z.enum(['member', 'external']),
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  deleted: z.boolean().default(false),
});

export type BrainItemPerson = z.infer<typeof brainItemPersonSchema>;

export const brainItemSourceSchema = z.object({
  kind: z.enum(['conversation', 'document', 'generated']),
  id: z.string().uuid().nullable().optional(),
  label: z.string().nullable().optional(),
});

export type BrainItemSource = z.infer<typeof brainItemSourceSchema>;

export const brainItemSchema = z.object({
  id: z.string().uuid(),
  item_type: brainItemTypeSchema,
  title: z.string(),
  summary: z.string(),
  status: z.string(),
  signal_kind: z
    .enum([
      'decision',
      'commitment',
      'stated_fact',
      'outcome_observation',
      'open_question',
      'potential_learning',
      'contradiction_signal',
    ])
    .nullable()
    .optional(),
  subject: z.string().nullable().optional(),
  evidence_quote: z.string().nullable().optional(),
  created_by: brainItemPersonSchema.nullable().optional(),
  source: brainItemSourceSchema.nullable().optional(),
  organization_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  source_id: z.string().nullable().optional(),
  generated: z.boolean().default(false),
  generation_metadata: z.record(z.string(), z.unknown()).default({}),
  related_ids: z.record(z.string(), z.string().uuid()).default({}),
  document_evidence: brainDocumentEvidenceSummarySchema.array().default([]),
  limitations: z.array(z.string()).default([]),
  status_detail: z.string().nullable().default(null),
  updated_at: z.string(),
});

export type BrainItem = z.infer<typeof brainItemSchema>;

export const brainAttentionReasonCodeSchema = z.enum([
  'unresolved_question',
  'processing_failed',
  'signal_linked',
  'signal_impact',
  'limitation',
]);

export type BrainAttentionReasonCode = z.infer<
  typeof brainAttentionReasonCodeSchema
>;

export const brainAttentionSchema = z.object({
  id: z.string().uuid(),
  item_type: brainItemTypeSchema,
  title: z.string(),
  reason_code: brainAttentionReasonCodeSchema,
  reason: z.string().nullable().optional(),
  status: z.string(),
  workspace_id: z.string().uuid().nullable(),
  related_ids: z.record(z.string(), z.string().uuid()).default({}),
  updated_at: z.string(),
});

export type BrainAttention = z.infer<typeof brainAttentionSchema>;

export const brainOverviewSchema = z.object({
  brain_enabled: z.boolean(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
  attention: brainAttentionSchema.array(),
  items: brainItemSchema.array(),
  next_cursor: z.string().nullable(),
});

export type BrainOverview = z.infer<typeof brainOverviewSchema>;

export const brainImpactSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  source_signal_id: z.string().uuid(),
  target_type: z.string(),
  target_id: z.string(),
  relationship_type: z.string(),
  status: z.string(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().nullable(),
  effective_at: z.string().nullable(),
  reconciliation_version: z.string(),
  actor_type: z.string(),
  actor_identity_id: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type BrainImpact = z.infer<typeof brainImpactSchema>;

export const brainImpactMaintenanceRequestSchema = z.object({
  status: z.enum(['dismissed', 'reversed']),
  note: z.string().max(10_000).nullable().optional(),
});

export type BrainImpactMaintenanceRequest = z.infer<
  typeof brainImpactMaintenanceRequestSchema
>;

export const brainHealthCategorySchema = z.enum([
  'stale_evidence',
  'evidence_shortfall',
  'contradiction',
  'duplicate_signal',
  'pipeline_failure',
]);

export const brainHealthSeveritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

export const brainHealthFindingStatusSchema = z.enum([
  'open',
  'snoozed',
  'dismissed',
  'resolved',
]);

export const brainHealthActionSchema = z.enum([
  'inspect',
  'retry',
  'resolve_gap',
  'review_contradiction',
  'review_duplicate',
  'maintain_signal',
  'maintain_decision',
]);

export const brainHealthScanStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'partial',
  'failed',
]);

export const brainHealthReferenceSchema = z.object({
  object_type: z.string(),
  object_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
  label: z.string().optional(),
});

export const brainHealthLifecycleSchema = z.object({
  id: z.string().uuid(),
  previous_status: z.string().nullable().optional(),
  status: z.string(),
  action: z.string(),
  rationale: z.string().nullable().optional(),
  acted_by: z.string().nullable().optional(),
  created_at: z.string(),
});

export const brainHealthFindingSchema = z.object({
  id: z.string().uuid(),
  category: brainHealthCategorySchema,
  status: brainHealthFindingStatusSchema,
  severity: brainHealthSeveritySchema,
  confidence: z.number().min(0).max(1),
  title: z.string(),
  explanation: z.string(),
  suggested_action: brainHealthActionSchema.nullable(),
  detector_version: z.string(),
  fingerprint: z.string(),
  references: brainHealthReferenceSchema.array().default([]),
  evidence: z.record(z.string(), z.unknown()).array().default([]),
  limitations: z.array(z.string()).default([]),
  first_seen_at: z.string(),
  last_seen_at: z.string(),
  snoozed_until: z.string().nullable().optional(),
  resolved_at: z.string().nullable().optional(),
  updated_at: z.string(),
  lifecycle_history: brainHealthLifecycleSchema.array().default([]),
});

export type BrainHealthFinding = z.infer<typeof brainHealthFindingSchema>;

export const brainHealthMetricsSchema = z.object({
  open_findings: z.number().int().nonnegative(),
  by_category: z.record(z.string(), z.number().int().nonnegative()),
  by_severity: z.record(z.string(), z.number().int().nonnegative()),
});

export const brainHealthDetectorSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'partial', 'failed']),
  findings_seen: z.number().int().nonnegative(),
  limitation: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
});

export const brainHealthScanSchema = z.object({
  id: z.string().uuid().nullable(),
  status: brainHealthScanStatusSchema,
  requested_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  last_scan_at: z.string().nullable().optional(),
  detectors: z.record(z.string(), brainHealthDetectorSchema).default({}),
  limitation: z.string().nullable().optional(),
});

export const brainHealthOverviewSchema = z.object({
  brain_enabled: z.boolean(),
  workspace_id: z.string().uuid().nullable(),
  metrics: brainHealthMetricsSchema,
  scan: brainHealthScanSchema,
  findings: brainHealthFindingSchema.array(),
  next_cursor: z.string().nullable(),
});

export type BrainHealthOverview = z.infer<typeof brainHealthOverviewSchema>;
export type BrainHealthMetrics = z.infer<typeof brainHealthMetricsSchema>;
export type BrainHealthScan = z.infer<typeof brainHealthScanSchema>;

export const brainHealthLifecycleRequestSchema = z.object({
  status: z.enum(['snoozed', 'dismissed', 'resolved']),
  rationale: z.string().max(2_000).nullable().optional(),
});

export type BrainHealthLifecycleRequest = z.infer<
  typeof brainHealthLifecycleRequestSchema
>;

export const brainHealthRefreshResponseSchema = z.object({
  scan_id: z.string().uuid(),
  status: brainHealthScanStatusSchema,
});

export type BrainHealthRefreshResponse = z.infer<
  typeof brainHealthRefreshResponseSchema
>;

export const brainTimelineSchema = z.object({
  root: brainItemSchema,
  timeline: brainItemSchema.array(),
});

export type BrainTimeline = z.infer<typeof brainTimelineSchema>;

export const brainMaintenanceRequestSchema = z.object({
  status: z.string().min(1).max(32),
  resolution_summary: z.string().max(10_000).nullable().optional(),
});

export type BrainMaintenanceRequest = z.infer<
  typeof brainMaintenanceRequestSchema
>;

export const knowledgeGapAttentionItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  kind: z.enum(['open_question', 'contradiction', 'evidence_shortfall']),
  materiality_score: z.number().min(0).max(1),
  materiality_reasons: z.array(z.string()).default([]),
  status: z.string(),
  workspace_id: z.string().uuid().nullable(),
  initiative_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const knowledgeGapAttentionSchema = z.object({
  enabled: z.boolean(),
  gaps: z.array(knowledgeGapAttentionItemSchema).default([]),
});

export const knowledgeGapContributionSchema = z.object({
  id: z.string().uuid(),
  knowledge_gap_id: z.string().uuid(),
  author_identity_id: z.string(),
  version: z.number().int().positive(),
  status: z.string(),
  content: z.string(),
  reference_urls: z.array(z.string()).default([]),
  reference_file_ids: z.array(z.string().uuid()).default([]),
  extraction: z.record(z.string(), z.unknown()).default({}),
  failure_reason: z.string().nullable().optional(),
  created_at: z.string(),
  processed_at: z.string().nullable().optional(),
});

export const knowledgeGapDetailSchema = knowledgeGapAttentionItemSchema.extend({
  investigation_prompt: z.string().nullable().optional(),
  resolution_summary: z.string().nullable().optional(),
  sources: z
    .array(
      z.object({
        id: z.string().uuid(),
        source_type: z.string(),
        source_id: z.string(),
        source_metadata: z.record(z.string(), z.unknown()).default({}),
        created_at: z.string(),
      }),
    )
    .default([]),
  lifecycle_audit: z
    .array(
      z.object({
        id: z.string().uuid(),
        previous_status: z.string().nullable().optional(),
        status: z.string(),
        action: z.string(),
        rationale: z.string().nullable().optional(),
        acted_by: z.string().nullable().optional(),
        created_at: z.string(),
      }),
    )
    .default([]),
  contributions: z.array(knowledgeGapContributionSchema).default([]),
});

export const knowledgeGapTriageRequestSchema = z.object({
  status: z.enum(['deferred', 'dismissed']),
  rationale: z.string().max(2_000).nullable().optional(),
});

export const knowledgeGapContributionRequestSchema = z.object({
  content: z.string().min(1).max(20_000),
  reference_urls: z.array(z.string()).max(10).default([]),
  reference_file_ids: z.array(z.string().uuid()).max(10).default([]),
});

export const knowledgeGapInvestigationSchema = z.object({
  conversation_id: z.string().uuid(),
  knowledge_gap_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable(),
});

export type KnowledgeGapAttention = z.infer<typeof knowledgeGapAttentionSchema>;
export type KnowledgeGapDetail = z.infer<typeof knowledgeGapDetailSchema>;
export type KnowledgeGapTriageRequest = z.infer<
  typeof knowledgeGapTriageRequestSchema
>;
export type KnowledgeGapContributionRequest = z.infer<
  typeof knowledgeGapContributionRequestSchema
>;
export type KnowledgeGapContribution = z.infer<
  typeof knowledgeGapContributionSchema
>;
export type KnowledgeGapInvestigation = z.infer<
  typeof knowledgeGapInvestigationSchema
>;
