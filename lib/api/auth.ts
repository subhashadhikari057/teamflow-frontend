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
  ResendVerificationPayload,
  ResetPasswordPayload,
  SessionsListResponse,
  TwoFactorBackupCodesResponse,
  TwoFactorEnableResponse,
  UpdateProfilePayload,
  Verify2FAPayload,
  VerifyEmailPayload,
} from './types';

export const authApi = {
  // ─── Core auth ─────────────────────────────────────────────────────────
  register:   (data: RegisterPayload)           => post<ActionResponse>('/auth/register', data),
  login:      (data: LoginPayload)              => post<LoginResponse>('/auth/login', data),
  // Refresh token comes from HttpOnly cookie — no body needed
  refresh:    ()                                => post<AuthSession>('/auth/refresh'),
  // Logout: backend reads refresh token from cookie, clears it
  logout:     ()                                => post<ActionResponse>('/auth/logout'),
  me:         ()                                => get<AuthUser>('/auth/me'),
  updateProfile: (data: UpdateProfilePayload)  => patch<AuthUser>('/auth/profile', data),

  // ─── Email verification ────────────────────────────────────────────────
  verifyEmail:        (data: VerifyEmailPayload)        => post<ActionResponse>('/auth/verify-email', data),
  resendVerification: (data: ResendVerificationPayload) => post<ActionResponse>('/auth/resend-verification', data),

  // ─── Password ──────────────────────────────────────────────────────────
  forgotPassword: (data: ForgotPasswordPayload) => post<ActionResponse>('/auth/forgot-password', data),
  resetPassword:  (data: ResetPasswordPayload)  => post<ActionResponse>('/auth/reset-password', data),
  changePassword: (data: ChangePasswordPayload) => patch<ActionResponse>('/auth/change-password', data),

  // ─── 2FA ───────────────────────────────────────────────────────────────
  enable2FA:              ()                        => post<TwoFactorEnableResponse>('/auth/2fa/enable'),
  confirm2FA:             (data: Confirm2FAPayload) => post<TwoFactorBackupCodesResponse>('/auth/2fa/confirm', data),
  verify2FA:              (data: Verify2FAPayload)  => post<LoginResponse>('/auth/2fa/verify', data),
  disable2FA:             (data: Disable2FAPayload) => post<ActionResponse>('/auth/2fa/disable', data),
  getBackupCodes:         ()                        => get<TwoFactorBackupCodesResponse>('/auth/2fa/backup-codes'),
  regenerateBackupCodes:  ()                        => post<TwoFactorBackupCodesResponse>('/auth/2fa/backup-codes/regenerate'),

  // ─── Sessions ──────────────────────────────────────────────────────────
  getSessions:       ()           => get<SessionsListResponse>('/auth/sessions'),
  revokeSession:     (id: string) => del<ActionResponse>(`/auth/sessions/${id}`),
  revokeAllSessions: ()           => del<ActionResponse>('/auth/sessions'),

  // ─── OAuth ─────────────────────────────────────────────────────────────
  getGoogleAuthUrl: (params?: OAuthParams) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return get<OAuthRedirectResponse>(`/auth/google${qs ? `?${qs}` : ''}`);
  },
  getGithubAuthUrl: (params?: OAuthParams) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return get<OAuthRedirectResponse>(`/auth/github${qs ? `?${qs}` : ''}`);
  },
};
