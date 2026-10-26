import { z } from 'zod';
import { conversationAttachmentSchema } from '../conversation-attachments/conversation-attachments.schemas';

const toolWebTraceSchema = z.object({
  kind: z.enum(['tool', 'web']),
  status: z.string(),
  tool_name: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  request_preview: z.string().nullable().optional(),
  response_preview: z.string().nullable().optional(),
  content_type: z.string().nullable().optional(),
  bytes: z.number().nullable().optional(),
});

export const conversationCancelResponseSchema = z.object({
  status: z.string(),
  request_id: z.string(),
});

export const conversationDocumentContextScopeSchema = z.enum([
  'default',
  'selected',
  'tagged',
]);

export const conversationDocumentContextSchema = z.object({
  scope: conversationDocumentContextScopeSchema,
  document_ids: z.array(z.string()),
  document_tags: z.array(z.string()),
});

export type ConversationDocumentContext = z.infer<
  typeof conversationDocumentContextSchema
>;

export const conversationDocumentContextUpdateRequestSchema = z.object({
  context: conversationDocumentContextSchema.nullable(),
});

export const organizationWelcomeInitializationResponseSchema = z.object({
  conversation_id: z.string().nullable(),
  message_id: z.string().nullable(),
});

export type OrganizationWelcomeInitializationResponse = z.infer<
  typeof organizationWelcomeInitializationResponseSchema
>;

export type ConversationCancelResponse = z.infer<
  typeof conversationCancelResponseSchema
> & {
  [key: string]: unknown;
};

export const suggestedActionSchema = z.object({
  id: z.enum(['upload_documents', 'create_agent']),
  label: z.string(),
});

export type SuggestedAction = z.infer<typeof suggestedActionSchema>;

export const generatedAttachmentSchema = z.object({
  artifact_id: z.string(),
  filename: z.string(),
  mime_type: z.string(),
  format: z.enum(['docx', 'pdf']),
  status: z.enum(['ready', 'pending', 'failed']),
  download_path: z.string(),
});

export type GeneratedAttachment = z.infer<typeof generatedAttachmentSchema>;

export const messageSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string().nullable(),
  message_kind: z.literal('organization_welcome').nullable().optional(),
  timestamp: z.string(),
  sources: z.array(
    z.object({
      score: z.number(),
      file_id: z.string(),
      snippet: z.string(),
      page_numbers: z.array(z.number()),
      source: z.string().nullable().optional(),
      source_url: z.string().nullable().optional(),
      source_provider: z.string().nullable().optional(),
      file_type: z.string().nullable().optional(),
      fileType: z.string().nullable().optional(),
      sheet_name: z.string().nullable().optional(),
      table_id: z.string().nullable().optional(),
      row_start: z.number().nullable().optional(),
      row_end: z.number().nullable().optional(),
      column_names: z.string().nullable().optional(),
      table_declared: z.string().nullable().optional(),
    }),
  ),
  rating: z.number().nullable(),
  feedback_text: z.string().nullable().optional(),
  agent_id: z.string().nullable(),
  tool_web_traces: z.array(toolWebTraceSchema).optional().default([]),
  // Older persisted messages and optimistic stream messages may not include
  // this field yet. Callers should treat an omitted value as an empty list.
  generated_attachments: z.array(generatedAttachmentSchema).optional(),
  suggested_actions: z.array(suggestedActionSchema).optional(),
  brain_citations: z.array(z.record(z.string(), z.any())).optional(),
  document_context: conversationDocumentContextSchema.nullable().optional(),
  // Files sent with this question. Older messages and optimistic stream
  // messages may omit it; treat that as an empty list.
  attachments: z.array(conversationAttachmentSchema).optional(),
  citations: z
    .array(
      z
        .object({
          display_ref: z.string(),
          file_id: z.string().optional(),
          chunk_id: z.string().optional(),
          source_id: z.string().optional(),
          snippet: z.string().optional(),
          page_numbers: z.array(z.number()).optional(),
          score: z.number().optional(),
          source: z.string().optional().nullable(),
          source_url: z.string().optional().nullable(),
          source_provider: z.string().optional().nullable(),
          document_name: z.string().optional().nullable(),
          content_type: z.string().optional(),
          image_id: z.string().optional(),
          image_s3_key: z.string().optional(),
        })
        .passthrough(),
    )
    .optional(),
});

export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  created_at: z.string(),
  id: z.string(),
  updated_at: z.string(),
  message_count: z.number(),
  messages: z.array(messageSchema),
});

export type Conversation = z.infer<typeof conversationSchema>;

export const conversationListConversationSchema = z.object({
  id: z.string(),
  title: z.string().nullish(),
  workspace_id: z.string().nullish(),
  last_message_preview: z.string().nullish(),
  message_count: z.number(),
  updated_at: z.string(),
  created_at: z.string(),
  pinned: z.boolean().optional().default(false),
});

export type ConversationListConversation = z.infer<
  typeof conversationListConversationSchema
>;

export const conversationUpdateResponseSchema = z.object({
  id: z.string(),
  title: z.string().nullish(),
  pinned: z.boolean(),
});

export type ConversationUpdateResponse = z.infer<
  typeof conversationUpdateResponseSchema
>;

export const conversationListResponseSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
  data: z.array(conversationListConversationSchema),
});

export type ConversationListResponse = z.infer<
  typeof conversationListResponseSchema
>;

export const conversationResponseSchema = z.object({
  document_context: conversationDocumentContextSchema
    .optional()
    .default({ scope: 'default', document_ids: [], document_tags: [] }),
  knowledge_gap_context: z
    .object({
      gap_id: z.string(),
      question: z.string(),
      investigation_prompt: z.string(),
      kind: z.string(),
      sources: z
        .array(z.object({ source_type: z.string(), source_id: z.string() }))
        .default([]),
    })
    .nullable()
    .optional()
    .default(null),
  messages: z.array(messageSchema),
  created_at: z.string(),
  id: z.string(),
  message_count: z.number(),
  updated_at: z.string(),
  user_id: z.string(),
  is_streaming: z.boolean(),
  streaming_request_id: z.string().nullable(),
  streaming_replace_message_id: z.string().nullable().optional(),
  sources: z
    .array(
      z.object({
        score: z.number(),
        file_id: z.string(),
        snippet: z.string(),
        page_numbers: z.array(z.number()),
      }),
    )
    .optional(),
});

export type ConversationResponse = z.infer<typeof conversationResponseSchema>;

export type ConversationDocumentContextUpdateRequest = z.infer<
  typeof conversationDocumentContextUpdateRequestSchema
>;

export const conversationDeleteResponseSchema = z.object({
  status: z.string(),
  conversation_id: z.string(),
});

export type ConversationDeleteResponse = z.infer<
  typeof conversationDeleteResponseSchema
>;
