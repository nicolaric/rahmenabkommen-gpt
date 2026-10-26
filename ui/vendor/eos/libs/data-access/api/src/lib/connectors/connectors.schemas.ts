import { z } from 'zod';

export const connectorAuthorizationUrlSchema = z.object({
  authorization_url: z.string(),
});

export const microsoftConnectorStatusSchema = z.object({
  configured: z.boolean(),
  notifications_enabled: z.boolean(),
  tenant: z
    .object({
      tenant_id: z.string(),
      status: z.string(),
      connected_by: z.string(),
      created_at: z.string(),
    })
    .nullable(),
  setup_session_active: z.boolean(),
});

const listOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item), count: z.number() });

export const connectorSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  web_url: z.string().nullable().optional(),
});

export const connectorTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const connectorTeamLocationSchema = z.object({
  kind: z.enum(['team_site', 'private_channel', 'shared_channel']),
  name: z.string(),
  site_id: z.string(),
  drive_id: z.string().nullable().optional(),
  root_item_id: z.string().nullable().optional(),
  web_url: z.string().nullable().optional(),
});

export const connectorDriveSchema = z.object({
  id: z.string(),
  name: z.string(),
  web_url: z.string().nullable().optional(),
});

export const connectorOneDriveSchema = z.object({
  site_id: z.string(),
  drive_id: z.string(),
  name: z.string(),
  owner_name: z.string().nullable().optional(),
  web_url: z.string().nullable().optional(),
});

export const connectorFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  web_url: z.string().nullable().optional(),
  child_count: z.number().nullable().optional(),
});

export const connectorSourceKindSchema = z.enum([
  'sharepoint',
  'teams',
  'onedrive',
]);

export const connectorSourceSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  workspace_id: z.string().nullable(),
  provider: z.string(),
  // Defaulted so a UI rolled out before the API still parses sources.
  kind: connectorSourceKindSchema.default('sharepoint'),
  name: z.string(),
  web_url: z.string().nullable(),
  site_id: z.string().nullable(),
  drive_id: z.string(),
  root_item_id: z.string().nullable(),
  status: z.enum(['active', 'paused', 'needs_attention', 'archived']),
  last_synced_at: z.string().nullable(),
  last_error: z.string().nullable(),
  created_by: z.string(),
  created_at: z.string(),
  initial_sync_pending: z.boolean(),
  sync_in_progress: z.boolean(),
  synced_document_count: z.number(),
  failed_item_count: z.number(),
});

export const connectorSourceCreateRequestSchema = z.object({
  site_id: z.string().min(1),
  drive_id: z.string().min(1),
  root_item_id: z.string().nullable().optional(),
  workspace_id: z.string().nullable().optional(),
  name: z.string().max(512).nullable().optional(),
  kind: connectorSourceKindSchema.optional(),
  visibility_acknowledged: z.literal(true),
});

export const connectorSyncRunSchema = z.object({
  id: z.string(),
  trigger: z.string(),
  status: z.enum(['running', 'succeeded', 'partial', 'failed']),
  created_count: z.number(),
  updated_count: z.number(),
  renamed_count: z.number(),
  deleted_count: z.number(),
  skipped_count: z.number(),
  failed_count: z.number(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  error: z.string().nullable(),
});

export const connectorSourceItemSchema = z.object({
  item_id: z.string(),
  name: z.string(),
  web_url: z.string().nullable(),
  status: z.string(),
  file_id: z.string().nullable(),
  attempts: z.number(),
  retry_at: z.string().nullable(),
  last_error: z.string().nullable(),
  updated_at: z.string(),
});

export const connectorSiteListSchema = listOf(connectorSiteSchema);
export const connectorTeamListSchema = listOf(connectorTeamSchema);
export const connectorTeamLocationListSchema = listOf(
  connectorTeamLocationSchema,
);
export const connectorDriveListSchema = listOf(connectorDriveSchema);
export const connectorFolderListSchema = listOf(connectorFolderSchema);
export const connectorSourceListSchema = listOf(connectorSourceSchema);
export const connectorSyncRunListSchema = listOf(connectorSyncRunSchema);
export const connectorSourceItemListSchema = listOf(connectorSourceItemSchema);
export const connectorArchiveResponseSchema = z.object({
  deleted_documents: z.number(),
});

export type ConnectorAuthorizationUrl = z.infer<
  typeof connectorAuthorizationUrlSchema
>;
export type MicrosoftConnectorStatus = z.infer<
  typeof microsoftConnectorStatusSchema
>;
export type ConnectorSite = z.infer<typeof connectorSiteSchema>;
export type ConnectorTeam = z.infer<typeof connectorTeamSchema>;
export type ConnectorTeamLocation = z.infer<typeof connectorTeamLocationSchema>;
export type ConnectorDrive = z.infer<typeof connectorDriveSchema>;
export type ConnectorOneDrive = z.infer<typeof connectorOneDriveSchema>;
export type ConnectorFolder = z.infer<typeof connectorFolderSchema>;
export type ConnectorSourceKind = z.infer<typeof connectorSourceKindSchema>;
export type ConnectorSource = z.infer<typeof connectorSourceSchema>;
export type ConnectorSourceCreateRequest = z.infer<
  typeof connectorSourceCreateRequestSchema
>;
export type ConnectorSyncRun = z.infer<typeof connectorSyncRunSchema>;
export type ConnectorSourceItem = z.infer<typeof connectorSourceItemSchema>;
export type ConnectorSourceItemStatus =
  | 'failed'
  | 'skipped_unsupported'
  | 'skipped_duplicate';
