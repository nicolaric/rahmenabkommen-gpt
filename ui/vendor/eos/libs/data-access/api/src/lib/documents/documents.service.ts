import {
  apiFetch,
  apiFetchJson,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  bulkDeleteDocumentsRequestSchema,
  bulkDownloadDocumentsRequestSchema,
  bulkUpdateDocumentTagsRequestSchema,
  documentChunkListSchema,
  documentPaginationSchema,
  documentRenameRequestSchema,
  documentTagsUpdateRequestSchema,
  documentTemplateSchema,
  documentUploadBatchResponseSchema,
  websiteIngestRequestSchema,
} from './documents.schemas';
import type {
  DocumentChunkList,
  DocumentPagination,
  DocumentMetadata,
  DocumentTemplate,
  DocumentRenameRequest,
  DocumentTagsUpdateRequest,
  DocumentUploadBatchResponse,
  WebsiteIngestRequest,
} from './documents.schemas';
import { ApiContextOptions, buildContextQuery } from '../context/context';

const baseUrl = `${import.meta.env.VITE_API_URL}/files`;

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadProgressHandler = (progress: UploadProgress) => void;

export type UploadDocumentsOptions = ApiContextOptions & {
  force?: boolean;
  asTemplate?: boolean;
  includeInKnowledgeBase?: boolean;
  templateName?: string;
  templateDescription?: string;
};

type FileWithRelativePath = File & {
  webkitRelativePath?: string;
  relativePath?: string;
};

const getUploadFilename = (file: File): string => {
  const fileWithPath = file as FileWithRelativePath;
  return (
    fileWithPath.webkitRelativePath || fileWithPath.relativePath || file.name
  );
};

export async function listDocumentTemplates(
  organizationId: string,
  request?: Request,
  options?: ApiContextOptions & {
    nameContains?: string;
    format?: 'docx' | 'dotx';
    tags?: string[];
    includeInactive?: boolean;
  },
): Promise<DocumentTemplate[]> {
  const params = new URLSearchParams(
    buildContextQuery(organizationId, options),
  );
  if (options?.nameContains) params.set('nameContains', options.nameContains);
  if (options?.format) params.set('format', options.format);
  for (const tag of options?.tags ?? []) params.append('tags', tag);
  if (options?.includeInactive) params.set('include_inactive', 'true');
  const response = await apiFetchJson(
    `${baseUrl}/templates?${params.toString()}`,
    {},
    { request },
  );
  return documentTemplateSchema.array().parse(response);
}

export async function archiveDocumentTemplate(
  templateId: string,
  organizationId: string,
  options?: ApiContextOptions,
): Promise<{ id: string; status: string }> {
  const params = buildContextQuery(organizationId, options);
  return apiFetchJson(`${baseUrl}/templates/${templateId}/archive?${params}`, {
    method: 'PATCH',
  });
}

export async function listDocuments(
  organizationId: string,
  request: Request | undefined,
  pagination: { page: number; pageSize: number },
  nameContains: string,
  options?: ApiContextOptions & {
    tags?: string[];
    includeTemplates?: boolean;
  },
): Promise<DocumentPagination> {
  const contextQuery = buildContextQuery(organizationId, options);
  const includeTemplatesQuery =
    options?.includeTemplates === false ? '&includeTemplates=false' : '';
  const tagsQuery = (options?.tags ?? [])
    .map((tag) => `tags=${encodeURIComponent(tag)}`)
    .join('&');
  return apiFetchJson(
    `${baseUrl}?page=${pagination.page}&page_size=${pagination.pageSize}&nameContains=${encodeURIComponent(nameContains)}&${contextQuery}${includeTemplatesQuery}${tagsQuery ? `&${tagsQuery}` : ''}`,
    {},
    {
      request,
      responseSchema: documentPaginationSchema,
      schemaName: 'DocumentPagination',
    },
  );
}

export async function patchDocumentTags(
  documentId: string,
  organizationId: string,
  payload: DocumentTagsUpdateRequest,
  options?: ApiContextOptions,
): Promise<DocumentMetadata> {
  const contextQuery = buildContextQuery(organizationId, options);
  validateRequestSchema(documentTagsUpdateRequestSchema, payload, {
    url: `${baseUrl}/${documentId}/tags?${contextQuery}`,
    schemaName: 'DocumentTagsUpdateRequest',
  });
  return apiFetchJson(`${baseUrl}/${documentId}/tags?${contextQuery}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function renameDocument(
  documentId: string,
  organizationId: string,
  payload: DocumentRenameRequest,
  options?: ApiContextOptions,
): Promise<DocumentMetadata> {
  const contextQuery = buildContextQuery(organizationId, options);
  validateRequestSchema(documentRenameRequestSchema, payload, {
    url: `${baseUrl}/${documentId}/rename?${contextQuery}`,
    schemaName: 'DocumentRenameRequest',
  });
  return apiFetchJson(`${baseUrl}/${documentId}/rename?${contextQuery}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function downloadDocument(
  documentId: string,
  organizationId: string,
  request: Request,
) {
  void documentId;
  void organizationId;
  void request;
}

export async function uploadDocuments(
  documents: File[],
  organizationId: string,
  request: Request,
  options?: UploadDocumentsOptions,
): Promise<unknown> {
  const formData = new FormData();
  for (const file of documents) {
    formData.append('files', file, getUploadFilename(file));
  }
  formData.append('organizationId', organizationId);

  if (options?.workspaceId) {
    formData.append('workspaceId', options.workspaceId);
  }
  if (options?.asTemplate) {
    formData.append('as_template', 'true');
  }
  if (options?.includeInKnowledgeBase) {
    formData.append('include_in_knowledge_base', 'true');
  }
  if (options?.templateName) {
    formData.append('template_name', options.templateName);
  }
  if (options?.templateDescription) {
    formData.append('template_description', options.templateDescription);
  }

  return apiFetchJson(
    `${baseUrl}?${buildContextQuery(organizationId, options)}`,
    {
      method: 'POST',
      body: formData,
    },
    { request },
  );
}

export async function addWebsiteDocument(
  organizationId: string,
  payload: WebsiteIngestRequest,
  options?: UploadDocumentsOptions,
): Promise<DocumentMetadata> {
  const searchParams = new URLSearchParams(
    buildContextQuery(organizationId, options),
  );
  if (options?.force) {
    searchParams.set('force', 'true');
  }

  validateRequestSchema(websiteIngestRequestSchema, payload, {
    url: `${baseUrl}/website?${searchParams.toString()}`,
    schemaName: 'WebsiteIngestRequest',
  });

  return apiFetchJson(`${baseUrl}/website?${searchParams.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function uploadDocumentsWithProgress(
  documents: File[] | FileList,
  organizationId: string,
  onProgress?: UploadProgressHandler,
  options?: UploadDocumentsOptions,
): Promise<DocumentUploadBatchResponse> {
  const files = Array.from(documents);
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file, getUploadFilename(file));
  }

  const searchParams = new URLSearchParams(
    buildContextQuery(organizationId, options),
  );
  if (options?.force) {
    searchParams.set('force', 'true');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}?${searchParams.toString()}`);
    xhr.withCredentials = true;

    xhr.onload = () => {
      const responseText = xhr.responseText || '';
      let data: unknown = null;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = null;
        }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(documentUploadBatchResponseSchema.parse(data));
        return;
      }
      const error = new Error('Upload failed') as Error & {
        status?: number;
        data?: unknown;
      };
      error.status = xhr.status;
      error.data = data;
      reject(error);
    };

    xhr.onerror = () => {
      const error = new Error('Upload failed') as Error & { status?: number };
      error.status = xhr.status || 0;
      reject(error);
    };

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress({ loaded: event.loaded, total: event.total, percent });
      };
    }

    if (options?.asTemplate) {
      formData.append('as_template', 'true');
    }
    if (options?.includeInKnowledgeBase) {
      formData.append('include_in_knowledge_base', 'true');
    }
    if (options?.templateName) {
      formData.append('template_name', options.templateName);
    }
    if (options?.templateDescription) {
      formData.append('template_description', options.templateDescription);
    }
    xhr.send(formData);
  });
}

export async function deleteDocument(
  documentId: string,
  organizationId: string,
  options?: ApiContextOptions,
): Promise<Response> {
  return apiFetch(
    `${baseUrl}/${documentId}?${buildContextQuery(organizationId, options)}`,
    {
      method: 'DELETE',
    },
  );
}

export async function reprocessDocument(
  documentId: string,
  organizationId: string,
  options?: ApiContextOptions,
): Promise<Response> {
  return apiFetch(
    `${baseUrl}/${documentId}/reprocess?${buildContextQuery(organizationId, options)}`,
    {
      method: 'POST',
    },
  );
}

export async function bulkDownloadDocuments(
  documentIds: string[],
  organizationId: string,
  options?: ApiContextOptions,
): Promise<Blob> {
  const payload = { file_ids: documentIds };
  const contextQuery = buildContextQuery(organizationId, options);
  const url = `${baseUrl}/bulk-download?${contextQuery}`;
  validateRequestSchema(bulkDownloadDocumentsRequestSchema, payload, {
    url,
    schemaName: 'BulkDownloadDocumentsRequest',
  });

  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = new Error('') as Error & {
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

  return response.blob();
}

export async function bulkDeleteDocuments(
  documentIds: string[],
  organizationId: string,
  options?: ApiContextOptions,
): Promise<Response> {
  const payload = { file_ids: documentIds };
  const contextQuery = buildContextQuery(organizationId, options);
  validateRequestSchema(bulkDeleteDocumentsRequestSchema, payload, {
    url: `${baseUrl}/bulk-delete?${contextQuery}`,
    schemaName: 'BulkDeleteDocumentsRequest',
  });
  return apiFetch(`${baseUrl}/bulk-delete?${contextQuery}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function bulkPatchDocumentTags(
  documentIds: string[],
  organizationId: string,
  tags: string[],
  options?: ApiContextOptions,
): Promise<Response> {
  const payload = { file_ids: documentIds, tags };
  const contextQuery = buildContextQuery(organizationId, options);
  validateRequestSchema(bulkUpdateDocumentTagsRequestSchema, payload, {
    url: `${baseUrl}/bulk-tags?${contextQuery}`,
    schemaName: 'BulkUpdateDocumentTagsRequest',
  });
  return apiFetch(`${baseUrl}/bulk-tags?${contextQuery}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function listDocumentChunks(
  documentId: string,
  organizationId: string,
  limit = 200,
  options?: ApiContextOptions,
): Promise<DocumentChunkList> {
  const searchParams = new URLSearchParams(
    buildContextQuery(organizationId, options),
  );
  searchParams.set('limit', String(limit));

  return apiFetchJson(
    `${baseUrl}/${documentId}/chunks?${searchParams.toString()}`,
    {},
    {
      responseSchema: documentChunkListSchema,
      schemaName: 'DocumentChunkList',
    },
  );
}

export function getDocumentDownloadUrl(
  documentId: string,
  organizationId: string,
  options?: ApiContextOptions,
): string {
  return `${baseUrl}/${documentId}/download?${buildContextQuery(
    organizationId,
    options,
  )}`;
}

export async function deleteDocuments(
  documentId: string,
  organizationId: string,
  request: Request,
) {
  void documentId;
  void organizationId;
  void request;
}
