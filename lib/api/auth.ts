import { get, post, patch, del } from './client';
import type {
  ActionResponse,
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  Confirm2FAPayload,
  Disable2FAPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  OAuthParams,
  OAuthRedirectResponse,
  RegisterPayload,
  RegenerateBackupCodesPayload,
  ResendVerificationPayload,
  ResetPasswordPayload,
  SessionsListResponse,
  TwoFactorBackupCodesResponse,
  TwoFactorEnableResponse,
  UpdateProfilePayload,
  SetCurrentWorkspacePayload,
  Verify2FAPayload,
  VerifyEmailPayload,
} from './types';

export const authApi = {
  // ─── Core auth ─────────────────────────────────────────────────────────
  register:   (data: RegisterPayload)           => post<ActionResponse>('/auth/register', data, { skipAuthRefresh: true, skipAuthRedirect: true }),
  login:      (data: LoginPayload)              => post<LoginResponse>('/auth/login', data, { skipAuthRefresh: true, skipAuthRedirect: true }),
  // Refresh token comes from HttpOnly cookie — no body needed
  refresh:    ()                                => post<AuthSession>('/auth/refresh'),
  // Logout: backend reads refresh token from cookie, clears it
  logout:     ()                                => post<ActionResponse>('/auth/logout'),
  me:         ()                                => get<AuthUser>('/auth/me'),
  setCurrentWorkspace: (data: SetCurrentWorkspacePayload) => patch<AuthUser>('/auth/current-workspace', data),
  updateProfile: (data: UpdateProfilePayload)  => patch<AuthUser>('/auth/profile', data),

  // ─── Email verification ────────────────────────────────────────────────
  verifyEmail:        (data: VerifyEmailPayload)        => post<ActionResponse>('/auth/verify-email', data, { skipAuthRefresh: true, skipAuthRedirect: true }),
  resendVerification: (data: ResendVerificationPayload) => post<ActionResponse>('/auth/resend-verification', data, { skipAuthRefresh: true, skipAuthRedirect: true }),

  // ─── Password ──────────────────────────────────────────────────────────
  forgotPassword: (data: ForgotPasswordPayload) => post<ActionResponse>('/auth/forgot-password', data, { skipAuthRefresh: true, skipAuthRedirect: true }),
  resetPassword:  (data: ResetPasswordPayload)  => post<ActionResponse>('/auth/reset-password', data, { skipAuthRefresh: true, skipAuthRedirect: true }),
  changePassword: (data: ChangePasswordPayload) => patch<ActionResponse>('/auth/change-password', data),

  // ─── 2FA ───────────────────────────────────────────────────────────────
  enable2FA:              ()                        => post<TwoFactorEnableResponse>('/auth/2fa/enable'),
  confirm2FA:             (data: Confirm2FAPayload) => post<TwoFactorBackupCodesResponse>('/auth/2fa/confirm', data),
  verify2FA:              (data: Verify2FAPayload)  => post<LoginResponse>('/auth/2fa/verify', data, { skipAuthRefresh: true, skipAuthRedirect: true }),
  disable2FA:             (data: Disable2FAPayload) => post<ActionResponse>('/auth/2fa/disable', data),
  getBackupCodes:         ()                        => get<TwoFactorBackupCodesResponse>('/auth/2fa/backup-codes'),
  regenerateBackupCodes:  (data: RegenerateBackupCodesPayload) => post<TwoFactorBackupCodesResponse>('/auth/2fa/backup-codes/regenerate', data),

  // ─── Sessions ──────────────────────────────────────────────────────────
  getSessions:       ()           => get<SessionsListResponse>('/auth/sessions'),
  revokeSession:     (id: string) => del<ActionResponse>(`/auth/sessions/${id}`),
  revokeAllSessions: ()           => del<ActionResponse>('/auth/sessions'),

  // ─── OAuth ─────────────────────────────────────────────────────────────
  getGoogleAuthUrl: (params?: OAuthParams) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return get<OAuthRedirectResponse>(`/auth/google${qs ? `?${qs}` : ''}`, { skipAuthRefresh: true, skipAuthRedirect: true });
  },
  getGithubAuthUrl: (params?: OAuthParams) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return get<OAuthRedirectResponse>(`/auth/github${qs ? `?${qs}` : ''}`, { skipAuthRefresh: true, skipAuthRedirect: true });
  },
};
