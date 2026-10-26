import { z } from 'zod';
import { conversationDocumentContextSchema } from '../conversations/conversations.schemas';

export const chatMessageRoleSchema = z.enum([
  'system',
  'user',
  'assistant',
  'tool',
]);

export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatMessageRoleSchema,
  content: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(chatMessageSchema).min(1),
  stream: z.boolean().optional(),
  conversation_id: z.string().optional(),
  request_id: z.string().optional(),
  workspaceId: z.string().optional(),
  replace_message_id: z.string().optional(),
  explicit_context_entry_ids: z.array(z.string()).optional(),
  templateId: z.string().nullable().optional(),
  document_context: conversationDocumentContextSchema.nullable().optional(),
  require_document_sources: z.boolean().optional(),
  // Draft conversation attachments sent with this question.
  attachment_ids: z.array(z.string()).optional(),
});

export type ChatCompletionRequest = z.infer<typeof chatCompletionRequestSchema>;

export const chatCompletionChunkToolCallFunctionSchema = z.object({
  name: z.string().optional(),
  arguments: z.string().optional(),
});

export const chatCompletionChunkToolCallSchema = z.object({
  index: z.number(),
  id: z.string().optional(),
  type: z.literal('function').optional(),
  function: chatCompletionChunkToolCallFunctionSchema.optional(),
});

export type ChatCompletionChunkToolCall = z.infer<
  typeof chatCompletionChunkToolCallSchema
>;

export const chatCompletionSuggestedActionSchema = z.object({
  id: z.enum(['upload_documents', 'create_agent']),
  label: z.string(),
});

export type ChatCompletionSuggestedAction = z.infer<
  typeof chatCompletionSuggestedActionSchema
>;

export const clarificationQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(
    z.object({
      label: z.string(),
      description: z.string().nullable().optional(),
    }),
  ),
  multi_select: z.boolean().optional(),
});

export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;

export const chatCompletionChunkDeltaSchema = z.object({
  block_id: z.string().nullable().optional(),
  role: z.string().optional(),
  content: z.string().nullable().optional(),
  reasoning_content: z.string().nullable().optional(),
  tool_calls: z.array(chatCompletionChunkToolCallSchema).optional(),
  title: z.string().optional(),
  sources: z.array(z.record(z.string(), z.any())).optional(),
  citations: z.array(z.record(z.string(), z.any())).optional(),
  brain_citations: z.array(z.record(z.string(), z.any())).optional(),
  tool_web_traces: z.array(z.record(z.string(), z.any())).optional(),
  generated_attachments: z.array(z.record(z.string(), z.any())).optional(),
  document_context: conversationDocumentContextSchema.nullable().optional(),
  trace_events: z.array(z.record(z.string(), z.any())).optional(),
  message_id: z.string().optional(),
  suggested_actions: z.array(chatCompletionSuggestedActionSchema).optional(),
  research_suggestion: z.record(z.string(), z.unknown()).optional(),
  follow_up_questions: z.array(z.string()).optional(),
  clarification_form: z
    .object({ questions: z.array(clarificationQuestionSchema) })
    .optional(),
});

export type ChatCompletionChunkDelta = z.infer<
  typeof chatCompletionChunkDeltaSchema
>;

export const chatCompletionChunkChoiceSchema = z.object({
  index: z.number(),
  delta: chatCompletionChunkDeltaSchema,
  finish_reason: z.string().nullable().optional(),
});

export const chatCompletionChunkSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion.chunk'),
  created: z.number(),
  model: z.string(),
  choices: z.array(chatCompletionChunkChoiceSchema),
  conversation_id: z.string().optional(),
});

export type ChatCompletionChunk = z.infer<typeof chatCompletionChunkSchema>;
