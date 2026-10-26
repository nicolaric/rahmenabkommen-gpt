import {
  apiFetch,
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import {
  connectorArchiveResponseSchema,
  connectorAuthorizationUrlSchema,
  connectorDriveListSchema,
  connectorFolderListSchema,
  connectorOneDriveSchema,
  connectorSiteListSchema,
  connectorSiteSchema,
  connectorSourceCreateRequestSchema,
  connectorSourceItemListSchema,
  connectorSourceListSchema,
  connectorSourceSchema,
  connectorSyncRunListSchema,
  connectorTeamListSchema,
  connectorTeamLocationListSchema,
  microsoftConnectorStatusSchema,
  type ConnectorAuthorizationUrl,
  type ConnectorDrive,
  type ConnectorFolder,
  type ConnectorOneDrive,
  type ConnectorSite,
  type ConnectorSource,
  type ConnectorSourceCreateRequest,
  type ConnectorSourceItem,
  type ConnectorSourceItemStatus,
  type ConnectorSyncRun,
  type ConnectorTeam,
  type ConnectorTeamLocation,
  type MicrosoftConnectorStatus,
} from './connectors.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/connectors`;

const url = (
  path: string,
  organizationId: string,
  params?: Record<string, string | string[] | undefined>,
) => {
  const query = new URLSearchParams({ organizationId });
  for (const [key, value] of Object.entries(params ?? {})) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry !== undefined && entry !== '') query.append(key, entry);
    }
  }
  return `${baseUrl}${path}?${query.toString()}`;
};

const segment = encodeURIComponent;

async function expectNoContent(
  response: Response,
  action: string,
): Promise<void> {
  if (!response.ok) {
    const error = new Error(
      `${action} failed: HTTP ${response.status}`,
    ) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }
}

// ── Microsoft 365 connection ─────────────────────────

export async function getMicrosoftConnectorStatus(
  organizationId: string,
  context?: RequestContext,
): Promise<MicrosoftConnectorStatus> {
  return apiFetchJson(
    url('/microsoft/status', organizationId),
    { method: 'GET' },
    {
      ...context,
      responseSchema: microsoftConnectorStatusSchema,
      schemaName: 'MicrosoftConnectorStatus',
    },
  );
}

export async function startMicrosoftConnectorConsent(
  organizationId: string,
  context?: RequestContext,
): Promise<ConnectorAuthorizationUrl> {
  return apiFetchJson(
    url('/microsoft/consent', organizationId),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorAuthorizationUrlSchema,
      schemaName: 'ConnectorAuthorizationUrl',
    },
  );
}

export async function startMicrosoftConnectorSetup(
  organizationId: string,
  context?: RequestContext,
): Promise<ConnectorAuthorizationUrl> {
  return apiFetchJson(
    url('/microsoft/setup', organizationId),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorAuthorizationUrlSchema,
      schemaName: 'ConnectorAuthorizationUrl',
    },
  );
}

export async function endMicrosoftConnectorSetup(
  organizationId: string,
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    url('/microsoft/setup', organizationId),
    { method: 'DELETE' },
    context,
  );
  await expectNoContent(response, 'End setup session');
}

export async function disconnectMicrosoftConnector(
  organizationId: string,
  context?: RequestContext,
): Promise<void> {
  const response = await apiFetch(
    url('/microsoft/disconnect', organizationId),
    { method: 'POST' },
    context,
  );
  await expectNoContent(response, 'Disconnect Microsoft 365');
}

// ── Site selection ───────────────────────────────────

export async function searchConnectorSites(
  organizationId: string,
  search: string,
  context?: RequestContext,
): Promise<ConnectorSite[]> {
  const response = await apiFetchJson<{ data: ConnectorSite[] }>(
    url('/microsoft/sites', organizationId, { search }),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorSiteListSchema,
      schemaName: 'ConnectorSiteList',
    },
  );
  return response.data;
}

export async function resolveConnectorSite(
  organizationId: string,
  siteUrl: string,
  context?: RequestContext,
): Promise<ConnectorSite> {
  return apiFetchJson<ConnectorSite>(
    url('/microsoft/sites/resolve', organizationId, { url: siteUrl }),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorSiteSchema,
      schemaName: 'ConnectorSite',
    },
  );
}

export async function listConnectorTeams(
  organizationId: string,
  context?: RequestContext,
): Promise<ConnectorTeam[]> {
  const response = await apiFetchJson<{ data: ConnectorTeam[] }>(
    url('/microsoft/teams', organizationId),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorTeamListSchema,
      schemaName: 'ConnectorTeamList',
    },
  );
  return response.data;
}

export async function listConnectorTeamLocations(
  organizationId: string,
  teamId: string,
  context?: RequestContext,
): Promise<ConnectorTeamLocation[]> {
  const response = await apiFetchJson<{ data: ConnectorTeamLocation[] }>(
    url(`/microsoft/teams/${segment(teamId)}/locations`, organizationId),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorTeamLocationListSchema,
      schemaName: 'ConnectorTeamLocationList',
    },
  );
  return response.data;
}

export async function getMyConnectorOneDrive(
  organizationId: string,
  context?: RequestContext,
): Promise<ConnectorOneDrive> {
  return apiFetchJson<ConnectorOneDrive>(
    url('/microsoft/onedrive', organizationId),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorOneDriveSchema,
      schemaName: 'ConnectorOneDrive',
    },
  );
}

export async function listConnectorDrives(
  organizationId: string,
  siteId: string,
  context?: RequestContext,
): Promise<ConnectorDrive[]> {
  const response = await apiFetchJson<{ data: ConnectorDrive[] }>(
    url(`/microsoft/sites/${segment(siteId)}/drives`, organizationId),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorDriveListSchema,
      schemaName: 'ConnectorDriveList',
    },
  );
  return response.data;
}

export async function listConnectorFolders(
  organizationId: string,
  driveId: string,
  itemId: string | null,
  context?: RequestContext,
): Promise<ConnectorFolder[]> {
  const response = await apiFetchJson<{ data: ConnectorFolder[] }>(
    url(`/microsoft/drives/${segment(driveId)}/folders`, organizationId, {
      itemId: itemId ?? undefined,
    }),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorFolderListSchema,
      schemaName: 'ConnectorFolderList',
    },
  );
  return response.data;
}

// ── Sources ──────────────────────────────────────────

export async function listConnectorSources(
  organizationId: string,
  options: { workspaceId?: string } = {},
  context?: RequestContext,
): Promise<ConnectorSource[]> {
  const response = await apiFetchJson<{ data: ConnectorSource[] }>(
    url('/sources', organizationId, {
      targetWorkspaceId: options.workspaceId,
    }),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorSourceListSchema,
      schemaName: 'ConnectorSourceList',
    },
  );
  return response.data;
}

export async function createConnectorSource(
  organizationId: string,
  payload: ConnectorSourceCreateRequest,
  context?: RequestContext,
): Promise<ConnectorSource> {
  validateRequestSchema(connectorSourceCreateRequestSchema, payload, {
    url: `${baseUrl}/sources`,
    schemaName: 'ConnectorSourceCreateRequest',
  });
  return apiFetchJson(
    url('/sources', organizationId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      responseSchema: connectorSourceSchema,
      schemaName: 'ConnectorSource',
    },
  );
}

export async function setConnectorSourceStatus(
  organizationId: string,
  sourceId: string,
  status: 'active' | 'paused',
  context?: RequestContext,
): Promise<ConnectorSource> {
  return apiFetchJson(
    url(`/sources/${segment(sourceId)}`, organizationId),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
    {
      ...context,
      responseSchema: connectorSourceSchema,
      schemaName: 'ConnectorSource',
    },
  );
}

export async function syncConnectorSource(
  organizationId: string,
  sourceId: string,
  context?: RequestContext,
): Promise<ConnectorSource> {
  return apiFetchJson(
    url(`/sources/${segment(sourceId)}/sync`, organizationId),
    { method: 'POST' },
    {
      ...context,
      responseSchema: connectorSourceSchema,
      schemaName: 'ConnectorSource',
    },
  );
}

export async function regrantConnectorSource(
  organizationId: string,
  sourceId: string,
  context?: RequestContext,
): Promise<ConnectorSource> {
  return apiFetchJson(
    url(`/sources/${segment(sourceId)}/regrant`, organizationId),
    { method: 'POST' },
    {
      ...context,
      responseSchema: connectorSourceSchema,
      schemaName: 'ConnectorSource',
    },
  );
}

export async function archiveConnectorSource(
  organizationId: string,
  sourceId: string,
  deleteDocuments: boolean,
  context?: RequestContext,
): Promise<number> {
  const response = await apiFetchJson<{ deleted_documents: number }>(
    url(`/sources/${segment(sourceId)}`, organizationId, {
      deleteDocuments: String(deleteDocuments),
    }),
    { method: 'DELETE' },
    {
      ...context,
      responseSchema: connectorArchiveResponseSchema,
      schemaName: 'ConnectorArchiveResponse',
    },
  );
  return response.deleted_documents;
}

export async function listConnectorSyncRuns(
  organizationId: string,
  sourceId: string,
  context?: RequestContext,
): Promise<ConnectorSyncRun[]> {
  const response = await apiFetchJson<{ data: ConnectorSyncRun[] }>(
    url(`/sources/${segment(sourceId)}/runs`, organizationId),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorSyncRunListSchema,
      schemaName: 'ConnectorSyncRunList',
    },
  );
  return response.data;
}

export async function listConnectorSourceItems(
  organizationId: string,
  sourceId: string,
  statuses: ConnectorSourceItemStatus[] = ['failed'],
  context?: RequestContext,
): Promise<ConnectorSourceItem[]> {
  const response = await apiFetchJson<{ data: ConnectorSourceItem[] }>(
    url(`/sources/${segment(sourceId)}/items`, organizationId, {
      status: statuses,
    }),
    { method: 'GET' },
    {
      ...context,
      responseSchema: connectorSourceItemListSchema,
      schemaName: 'ConnectorSourceItemList',
    },
  );
  return response.data;
}
