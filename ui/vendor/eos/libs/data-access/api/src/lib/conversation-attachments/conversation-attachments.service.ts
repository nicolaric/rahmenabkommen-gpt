import { apiFetch, apiFetchJson } from '@eos/data-access/shared';
import { ApiContextOptions, buildContextQuery } from '../context/context';
import { conversationAttachmentListResponseSchema } from './conversation-attachments.schemas';
import type { ConversationAttachmentListResponse } from './conversation-attachments.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/conversation-attachments`;

/**
 * Upload files as draft attachments for the next question. They belong to
 * the uploader until they are sent with a message.
 */
export async function uploadConversationAttachments(
  files: File[],
  organizationId: string,
  options?: ApiContextOptions,
): Promise<ConversationAttachmentListResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file, file.name);
  }

  return apiFetchJson(
    `${baseUrl}?${buildContextQuery(organizationId, options)}`,
    { method: 'POST', body: formData },
    {
      responseSchema: conversationAttachmentListResponseSchema,
      schemaName: 'ConversationAttachmentListResponse',
    },
  );
}

/** The current state of the given attachments the caller may see. */
export async function listConversationAttachments(
  ids: string[],
  organizationId: string,
  options?: ApiContextOptions,
): Promise<ConversationAttachmentListResponse> {
  const params = new URLSearchParams(
    buildContextQuery(organizationId, options),
  );
  for (const id of ids) params.append('ids', id);

  return apiFetchJson(
    `${baseUrl}?${params.toString()}`,
    { method: 'GET' },
    {
      responseSchema: conversationAttachmentListResponseSchema,
      schemaName: 'ConversationAttachmentListResponse',
    },
  );
}

/** Remove a draft attachment; sent attachments cannot be removed (409). */
export async function deleteConversationAttachment(
  attachmentId: string,
  organizationId: string,
  options?: ApiContextOptions,
): Promise<void> {
  const response = await apiFetch(
    `${baseUrl}/${attachmentId}?${buildContextQuery(organizationId, options)}`,
    { method: 'DELETE' },
  );

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as Error & {
      status?: number;
      response?: { data?: unknown };
    };
    error.status = response.status;
    try {
      error.response = { data: await response.clone().json() };
    } catch {
      error.response = { data: await response.clone().text() };
    }
    throw error;
  }
}
