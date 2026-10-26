import { z } from 'zod';

export const workspaceSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  disabled_at: z.string().nullable().optional(),
  disabled_by: z.string().nullable().optional(),
  is_disabled: z.boolean().default(false),
  member_count: z.number().nullable().optional(),
  user_role: z.string().nullable().optional(),
});

export type Workspace = z.infer<typeof workspaceSchema>;

export const workspaceListResponseSchema = z.object({
  data: z.array(workspaceSchema),
  count: z.number(),
});

export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;

export const disableWorkspaceResponseSchema = z.object({
  message: z.string(),
  workspace_id: z.string(),
  disabled_at: z.string(),
  disabled_by: z.string(),
});

export type DisableWorkspaceResponse = z.infer<
  typeof disableWorkspaceResponseSchema
>;

export const enableWorkspaceResponseSchema = z.object({
  message: z.string(),
  workspace_id: z.string(),
});

export type EnableWorkspaceResponse = z.infer<
  typeof enableWorkspaceResponseSchema
>;

export const createWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

export type CreateWorkspaceRequest = z.infer<
  typeof createWorkspaceRequestSchema
>;

export const updateWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
});

export type UpdateWorkspaceRequest = z.infer<
  typeof updateWorkspaceRequestSchema
>;

export const workspaceMemberSchema = z.object({
  identity_id: z.string(),
  email: z.string().nullable().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  joined_at: z.string().nullable().optional(),
  invited_by: z.string().nullable().optional(),
  invited_at: z.string().nullable().optional(),
  // Only reported to organization owners.
  mfa_enabled: z.boolean().nullable().optional(),
});

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;

export const workspaceMemberListResponseSchema = z.object({
  data: z.array(workspaceMemberSchema),
  total: z.number(),
});

export type WorkspaceMemberListResponse = z.infer<
  typeof workspaceMemberListResponseSchema
>;

export const addWorkspaceMembersRequestSchema = z.object({
  identity_ids: z.array(z.string()).min(1),
  role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
});

export type AddWorkspaceMembersRequest = z.infer<
  typeof addWorkspaceMembersRequestSchema
>;

export const addWorkspaceMembersResponseSchema = z.object({
  message: z.string(),
  workspace_id: z.string(),
  total_processed: z.number(),
  added: z.array(z.string()),
  already_members: z.array(z.string()),
  failed: z.array(z.string()),
});

export type AddWorkspaceMembersResponse = z.infer<
  typeof addWorkspaceMembersResponseSchema
>;

export const updateWorkspaceMemberRoleRequestSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type UpdateWorkspaceMemberRoleRequest = z.infer<
  typeof updateWorkspaceMemberRoleRequestSchema
>;

export const updateWorkspaceMemberRoleResponseSchema = z.object({
  message: z.string(),
  workspace_id: z.string(),
  identity_id: z.string(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type UpdateWorkspaceMemberRoleResponse = z.infer<
  typeof updateWorkspaceMemberRoleResponseSchema
>;

export const removeWorkspaceMemberResponseSchema = z.object({
  message: z.string(),
  workspace_id: z.string(),
  identity_id: z.string(),
});

export type RemoveWorkspaceMemberResponse = z.infer<
  typeof removeWorkspaceMemberResponseSchema
>;
