import { z } from 'zod';

export const conversationAttachmentStatusSchema = z.enum([
  'uploading',
  'uploaded',
  'queued',
  'processing',
  'reprocessing',
  'processed',
  'ready',
  'empty',
  'failed',
]);

export type ConversationAttachmentStatus = z.infer<
  typeof conversationAttachmentStatusSchema
>;

/**
 * A file added to one conversation only. It stays a draft, visible only to
 * the uploader, until it is sent with a question (`conversation_id` is null
 * until then); it never enters the organization's document library.
 */
export const conversationAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  file_type: z.string().nullable(),
  file_size: z.number(),
  status: conversationAttachmentStatusSchema,
  conversation_id: z.string().nullable(),
  created_at: z.string(),
});

export type ConversationAttachment = z.infer<
  typeof conversationAttachmentSchema
>;

export const conversationAttachmentListResponseSchema = z.object({
  attachments: z.array(conversationAttachmentSchema),
});

export type ConversationAttachmentListResponse = z.infer<
  typeof conversationAttachmentListResponseSchema
>;

const TERMINAL_CONVERSATION_ATTACHMENT_STATUSES: ReadonlySet<ConversationAttachmentStatus> =
  new Set(['processed', 'ready', 'empty', 'failed']);

/** Whether processing of an attachment has ended, successfully or not. */
export function isConversationAttachmentTerminal(
  status: ConversationAttachmentStatus,
): boolean {
  return TERMINAL_CONVERSATION_ATTACHMENT_STATUSES.has(status);
}
