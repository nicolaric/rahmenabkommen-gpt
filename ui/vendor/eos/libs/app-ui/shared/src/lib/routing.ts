export type AppRouteContext = {
  orgId: string;
  workspaceId?: string | null;
};

export function buildDocumentsPath(context: AppRouteContext): string {
  const { orgId, workspaceId } = context;

  if (workspaceId) {
    return `/${orgId}/workspaces/${workspaceId}/documents`;
  }

  return `/${orgId}/documents`;
}

export function buildNewConversationPath(context: AppRouteContext): string {
  const { orgId, workspaceId } = context;

  if (workspaceId) {
    return `/${orgId}/workspaces/${workspaceId}/conversations/new`;
  }

  return `/${orgId}/conversations/new`;
}

export function buildBrainPath(context: AppRouteContext): string {
  const { orgId, workspaceId } = context;

  if (workspaceId) {
    return `/${orgId}/workspaces/${workspaceId}/brain`;
  }

  return `/${orgId}/brain`;
}

export function buildConversationPath(
  context: AppRouteContext,
  conversationId: string,
): string {
  const { orgId, workspaceId } = context;

  if (workspaceId) {
    return `/${orgId}/workspaces/${workspaceId}/conversations/${conversationId}`;
  }

  return `/${orgId}/conversations/${conversationId}`;
}
