export type ApiContextOptions = {
  workspaceId?: string;
};

export function buildContextQuery(
  organizationId: string,
  options?: ApiContextOptions,
): string {
  const searchParams = new URLSearchParams({ organizationId });

  if (options?.workspaceId) {
    searchParams.set('workspaceId', options.workspaceId);
  }

  return searchParams.toString();
}

export function buildContextUrl(
  baseUrl: string,
  organizationId: string,
  options?: ApiContextOptions,
): string {
  return `${baseUrl}?${buildContextQuery(organizationId, options)}`;
}
