export type WorkspacePlan = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  plan: WorkspacePlan;
  isVerified: boolean;
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceInviterSummary {
  id: string;
  name: string;
  username: string;
}

export interface WorkspaceInviteSummary {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: InviteStatus;
  invitedBy: WorkspaceInviterSummary;
  expiresAt: string;
  resendCount: number;
  createdAt: string;
}

export interface WorkspaceMemberSummary {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  role: WorkspaceRole;
  jobTitle?: string | null;
  department?: string | null;
  joinedAt: string;
}

export interface WorkspaceOnboardingInviteInput {
  email: string;
}

export interface WorkspaceOnboardingPayload {
  name: string;
  description?: string;
  logoUrl?: string;
  invites?: WorkspaceOnboardingInviteInput[];
  inviteRole?: WorkspaceRole;
}

export interface WorkspaceOnboardingResponse {
  workspace: WorkspaceSummary;
  invites: WorkspaceInviteSummary[];
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  logoUrl?: string;
  description?: string;
  allowedEmailDomain?: string;
}

export interface AcceptWorkspaceInvitePayload {
  token: string;
}

export interface DeclineWorkspaceInvitePayload {
  token: string;
}

export interface InviteWorkspaceMembersPayload {
  emails: string[];
  role: WorkspaceRole;
}

export interface UpdateWorkspaceMemberPayload {
  role?: WorkspaceRole;
  jobTitle?: string;
  department?: string;
}

export interface AdminWorkspaceCreatorSummary {
  id: string;
  name: string;
  username: string;
  email: string;
}

export interface AdminWorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  plan: WorkspacePlan;
  isActive: boolean;
  isVerified: boolean;
  maxMembers: number;
  memberCount: number;
  inviteCount: number;
  createdBy: AdminWorkspaceCreatorSummary;
  createdAt: string;
  deletedAt?: string | null;
}

export interface AdminListWorkspacesQuery {
  cursor?: string;
  limit?: number;
  plan?: WorkspacePlan;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface AdminUpdateWorkspacePlanPayload {
  plan: WorkspacePlan;
}
