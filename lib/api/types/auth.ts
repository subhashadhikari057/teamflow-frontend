import type { GlobalRole } from './common';
import type { WorkspaceRole } from './workspaces';

export type UserStatus =
  | 'ONLINE'
  | 'AWAY'
  | 'BUSY'
  | 'OFFLINE'
  | 'DO_NOT_DISTURB'
  | 'IN_A_MEETING'
  | 'ON_VACATION'
  | 'OUT_OF_OFFICE'
  | 'FOCUSING';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string;
  status?: UserStatus;
  timezone?: string;
  role: GlobalRole;
  isEmailVerified: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastSeenAt?: string;
  createdAt: string;
  currentWorkspace?: {
    id: string;
    slug: string;
    name: string;
    role: WorkspaceRole;
  } | null;
}

export interface UpdateProfilePayload {
  name?: string;
  avatarUrl?: string;
  phone?: string;
  status?: UserStatus;
  timezone?: string;
}

export interface SetCurrentWorkspacePayload {
  workspaceId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: TokenPair;
}

export interface SessionItem {
  id: string;
  isCurrent: boolean;
  deviceToken?: string;
  deviceType?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionsListResponse {
  items: SessionItem[];
}

export type LoginResponse =
  | { requiresTwoFactor: false; session: AuthSession }
  | { requiresTwoFactor: true; challengeToken: string };

export interface TwoFactorEnableResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

export interface TwoFactorBackupCodesResponse {
  codes: string[];
}

export interface OAuthRedirectResponse {
  url: string;
}

// ─── Request payloads ──────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginPayload {
  identifier: string; // email or username
  password: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface Verify2FAPayload {
  challengeToken: string;
  code?: string;
  backupCode?: string;
}

export interface Confirm2FAPayload {
  code: string;
}

export interface Disable2FAPayload {
  password: string;
}

export interface RegenerateBackupCodesPayload {
  password: string;
}

export interface OAuthParams {
  redirectUri?: string;
  clientState?: string;
}
