import { del, get, patch, post } from './client';
import type {
  AcceptWorkspaceInvitePayload,
  ActionResponse,
  AdminListWorkspacesQuery,
  AdminUpdateWorkspacePlanPayload,
  AdminWorkspaceSummary,
  CreateWorkspacePayload,
  DeclineWorkspaceInvitePayload,
  InviteWorkspaceMembersPayload,
  UpdateWorkspaceMemberPayload,
  UpdateWorkspacePayload,
  WorkspaceInviteSummary,
  WorkspaceMemberSummary,
  WorkspaceOnboardingPayload,
  WorkspaceOnboardingResponse,
  WorkspaceSummary,
} from './types';

function buildQuery(
  params: Record<string, string | number | boolean | undefined> | AdminListWorkspacesQuery,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const workspacesApi = {
  getSuggestedChannels: () =>
    get<string[]>('/mobile/workspaces/suggested-channels', {
      skipAuthRefresh: true,
      skipAuthRedirect: true,
    }),

  acceptInvite: (data: AcceptWorkspaceInvitePayload) =>
    post<WorkspaceSummary>('/mobile/workspaces/invites/accept', data),

  declineInvite: (data: DeclineWorkspaceInvitePayload) =>
    post<ActionResponse>('/mobile/workspaces/invites/decline', data),

  create: (data: CreateWorkspacePayload) =>
    post<WorkspaceSummary>('/mobile/workspaces', data),

  createOnboarding: (data: WorkspaceOnboardingPayload) =>
    post<WorkspaceOnboardingResponse>('/mobile/workspaces/onboarding', data),

  list: () =>
    get<WorkspaceSummary[]>('/mobile/workspaces'),

  getById: (workspaceId: string) =>
    get<WorkspaceSummary>(`/mobile/workspaces/${workspaceId}`),

  update: (workspaceId: string, data: UpdateWorkspacePayload) =>
    patch<WorkspaceSummary>(`/mobile/workspaces/${workspaceId}`, data),

  delete: (workspaceId: string) =>
    del<void>(`/mobile/workspaces/${workspaceId}`),

  inviteMembers: (workspaceId: string, data: InviteWorkspaceMembersPayload) =>
    post<WorkspaceInviteSummary[]>(`/mobile/workspaces/${workspaceId}/invites`, data),

  listInvites: (workspaceId: string) =>
    get<WorkspaceInviteSummary[]>(`/mobile/workspaces/${workspaceId}/invites`),

  revokeInvite: (workspaceId: string, inviteId: string) =>
    del<void>(`/mobile/workspaces/${workspaceId}/invites/${inviteId}`),

  resendInvite: (workspaceId: string, inviteId: string) =>
    post<WorkspaceInviteSummary>(`/mobile/workspaces/${workspaceId}/invites/${inviteId}/resend`),

  listMembers: (workspaceId: string) =>
    get<WorkspaceMemberSummary[]>(`/mobile/workspaces/${workspaceId}/members`),

  updateOwnMembership: (workspaceId: string, data: UpdateWorkspaceMemberPayload) =>
    patch<WorkspaceMemberSummary>(`/mobile/workspaces/${workspaceId}/members/me`, data),

  updateMember: (workspaceId: string, userId: string, data: UpdateWorkspaceMemberPayload) =>
    patch<WorkspaceMemberSummary>(`/mobile/workspaces/${workspaceId}/members/${userId}`, data),

  removeMember: (workspaceId: string, userId: string) =>
    del<ActionResponse>(`/mobile/workspaces/${workspaceId}/members/${userId}`),

  leave: (workspaceId: string) =>
    post<ActionResponse>(`/mobile/workspaces/${workspaceId}/members/leave`),
};

export const adminWorkspacesApi = {
  list: (query: AdminListWorkspacesQuery = {}) =>
    get<AdminWorkspaceSummary[]>(`/admin/workspaces${buildQuery(query)}`),

  getById: (workspaceId: string) =>
    get<AdminWorkspaceSummary>(`/admin/workspaces/${workspaceId}`),

  toggleVerify: (workspaceId: string) =>
    patch<AdminWorkspaceSummary>(`/admin/workspaces/${workspaceId}/verify`),

  updatePlan: (workspaceId: string, data: AdminUpdateWorkspacePlanPayload) =>
    patch<AdminWorkspaceSummary>(`/admin/workspaces/${workspaceId}/plan`, data),

  suspend: (workspaceId: string) =>
    patch<AdminWorkspaceSummary>(`/admin/workspaces/${workspaceId}/suspend`),

  activate: (workspaceId: string) =>
    patch<AdminWorkspaceSummary>(`/admin/workspaces/${workspaceId}/activate`),

  delete: (workspaceId: string) =>
    del<ActionResponse>(`/admin/workspaces/${workspaceId}`),
};
