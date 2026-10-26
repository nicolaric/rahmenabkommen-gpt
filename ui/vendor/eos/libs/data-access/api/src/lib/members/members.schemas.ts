import { z } from 'zod';

export const memberSchema = z.object({
  identity_id: z.string(),
  joined_at: z.string(),
  invited_at: z.string(),
  invited_by: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  state: z.enum(['invited', 'active']),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'CONVERSATION_ONLY']),
  // Only reported to organization owners.
  mfa_enabled: z.boolean().nullable().optional(),
});

export type Member = z.infer<typeof memberSchema>;

export const memberResponseSchema = z.object({
  data: z.array(memberSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
});

export type MemberResponse = z.infer<typeof memberResponseSchema>;

export const addMembersRequestSchema = z.object({
  user_emails: z.array(z.string()),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'CONVERSATION_ONLY']),
});

export type AddMembersRequest = z.infer<typeof addMembersRequestSchema>;

export const updateMemberRoleRequestSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'CONVERSATION_ONLY']),
});

export type UpdateMemberRoleRequest = z.infer<
  typeof updateMemberRoleRequestSchema
>;
