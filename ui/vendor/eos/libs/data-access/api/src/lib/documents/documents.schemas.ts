import { z } from 'zod';

export const documentTemplateSchema = z.object({
  id: z.string(),
  file_id: z.string(),
  organization_id: z.string(),
  workspace_id: z.string().nullable().optional(),
  template_key: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  format: z.enum(['docx', 'dotx']),
  status: z.enum(['active', 'archived', 'unavailable']),
  version: z.number(),
  content_hash: z.string(),
  placeholders: z.array(z.string()).default([]),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type DocumentTemplate = z.infer<typeof documentTemplateSchema>;

export const documentMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  document_kind: z.enum(['knowledge', 'template']).default('knowledge'),
  include_in_knowledge_base: z.boolean().default(false),
  fileType: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  uploaded_by: z.string().nullable().optional(),
  file_size: z.number(),
  source_provider: z.string().nullable().optional(),
  source_id: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  status: z.enum([
    'uploading',
    'uploaded',
    'queued',
    'processing',
    'processed',
    'reprocessing',
    'ready',
    'failed',
    'deleted',
    'empty',
  ]),
  tags: z.array(z.string()).default([]),
});

export const documentTagsUpdateRequestSchema = z.object({
  tags: z.array(z.string()),
});

export const documentRenameRequestSchema = z.object({
  name: z.string().min(1).max(100),
});

export const websiteIngestRequestSchema = z.object({
  url: z.string().min(1).max(2048),
  name: z.string().min(1).max(100).optional(),
  tags: z.array(z.string()).default([]),
});

export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
export type DocumentTagsUpdateRequest = z.infer<
  typeof documentTagsUpdateRequestSchema
>;
export type DocumentRenameRequest = z.infer<typeof documentRenameRequestSchema>;
export type WebsiteIngestRequest = z.infer<typeof websiteIngestRequestSchema>;

export const documentPaginationSchema = z.object({
  data: z.array(documentMetadataSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
});

export type DocumentPagination = z.infer<typeof documentPaginationSchema>;

export const bulkDownloadDocumentsRequestSchema = z.object({
  file_ids: z.array(z.string()).min(1).max(100),
});

export const bulkDeleteDocumentsRequestSchema = z.object({
  file_ids: z.array(z.string()),
});

export type BulkDeleteDocumentsRequest = z.infer<
  typeof bulkDeleteDocumentsRequestSchema
>;

export const bulkUpdateDocumentTagsRequestSchema = z.object({
  file_ids: z.array(z.string()),
  tags: z.array(z.string()),
});

export type BulkUpdateDocumentTagsRequest = z.infer<
  typeof bulkUpdateDocumentTagsRequestSchema
>;

const nullableChunkIdSchema = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    }

    return value;
  }, z.number().nullable())
  .default(null);

const pageNumbersSchema = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return [];
    }

    let rawValue = value;
    if (typeof value === 'string') {
      try {
        rawValue = JSON.parse(value);
      } catch {
        rawValue = value.split(',');
      }
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    return values
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }, z.array(z.number()))
  .default([]);

export const documentChunkSchema = z.object({
  redis_id: z.string().nullable().optional(),
  chunk_id: nullableChunkIdSchema,
  content: z.preprocess(
    (value) => (value === undefined || value === null ? '' : value),
    z.coerce.string(),
  ),
  page_numbers: pageNumbersSchema,
  source: z.string().nullable().optional(),
  file_type: z.string().nullable().optional(),
  sheet_name: z.string().nullable().optional(),
  table_id: z.string().nullable().optional(),
  row_start: z.number().nullable().optional(),
  row_end: z.number().nullable().optional(),
  column_names: z.string().nullable().optional(),
  table_declared: z.string().nullable().optional(),
});

export type DocumentChunk = z.infer<typeof documentChunkSchema>;

export const documentChunkListSchema = z.object({
  file_id: z.string(),
  total: z.number(),
  truncated: z.boolean(),
  chunks: z.array(documentChunkSchema),
});

export type DocumentChunkList = z.infer<typeof documentChunkListSchema>;

export const documentUploadFailureSchema = z.object({
  filename: z.string(),
  error: z.string(),
});

export type DocumentUploadFailure = z.infer<typeof documentUploadFailureSchema>;

export const documentUploadSuccessSchema = z.object({
  file: documentMetadataSchema,
  message: z.string().nullable().optional(),
  is_overwrite: z.boolean().optional(),
});

export type DocumentUploadSuccess = z.infer<typeof documentUploadSuccessSchema>;

export const documentUploadBatchResponseSchema = z.object({
  message: z.string(),
  successful: z.array(documentUploadSuccessSchema),
  failed: z.array(documentUploadFailureSchema),
});

export type DocumentUploadBatchResponse = z.infer<
  typeof documentUploadBatchResponseSchema
>;
