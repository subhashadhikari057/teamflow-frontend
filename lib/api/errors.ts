import { getErrorCode } from './client';

// Maps every backend AUTH_ERROR_CODE to a user-facing message
const AUTH_MESSAGES: Record<string, string> = {
  // Credentials
  AUTH_INVALID_CREDENTIALS:        'Invalid email or password.',
  AUTH_ACCOUNT_INACTIVE:           'Your account has been deactivated. Contact support.',
  AUTH_EMAIL_NOT_VERIFIED:         'Please verify your email before logging in.',
  AUTH_USER_NOT_FOUND:             'Account not found.',

  // Registration
  AUTH_EMAIL_ALREADY_REGISTERED:   'This email is already registered.',
  AUTH_USERNAME_ALREADY_TAKEN:     'This username is already taken.',

  // Tokens
  AUTH_ACCESS_TOKEN_INVALID:       'Your session has expired. Please log in again.',
  AUTH_ACCESS_TOKEN_MISSING:       'Authentication required. Please log in.',
  AUTH_INVALID_REFRESH_TOKEN:      'Your session has expired. Please log in again.',
  AUTH_REFRESH_TOKEN_NOT_FOUND:    'Session not found. Please log in again.',
  AUTH_INVALID_SESSION:            'Invalid session. Please log in again.',

  // Email verification
  AUTH_INVALID_VERIFICATION_TOKEN: 'Verification link is invalid or has expired.',

  // Password
  AUTH_INVALID_RESET_TOKEN:        'Password reset link is invalid or has expired.',
  AUTH_CURRENT_PASSWORD_INVALID:   'Current password is incorrect.',
  AUTH_PASSWORD_LOGIN_NOT_ENABLED: 'Password login is not enabled for this account.',

  // 2FA
  AUTH_INVALID_TWO_FACTOR_CODE:    'Invalid authentication code. Please try again.',
  AUTH_TWO_FACTOR_CHALLENGE_INVALID:'Two-factor session expired. Please log in again.',
  AUTH_TWO_FACTOR_ALREADY_ENABLED: 'Two-factor authentication is already enabled.',
  AUTH_TWO_FACTOR_NOT_ENABLED:     'Two-factor authentication is not enabled.',
  AUTH_TWO_FACTOR_NOT_SETUP:       'Please complete 2FA setup first.',
  AUTH_BACKUP_CODES_NOT_AVAILABLE: 'Backup codes are no longer available. Please regenerate.',

  // Sessions
  AUTH_SESSION_NOT_FOUND:          'Session not found.',

  // OAuth
  AUTH_GOOGLE_OAUTH_NOT_CONFIGURED:'Google login is not available right now.',
  AUTH_GITHUB_OAUTH_NOT_CONFIGURED:'GitHub login is not available right now.',
  AUTH_OAUTH_PROVIDER_REQUEST_FAILED: 'OAuth login failed. Please try again.',
  AUTH_OAUTH_STATE_INVALID:        'OAuth session expired. Please try again.',
};

const FALLBACK = 'Something went wrong. Please try again.';

export function getAuthErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  return AUTH_MESSAGES[code] ?? FALLBACK;
}
