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

const WORKSPACE_MESSAGES: Record<string, string> = {
  WORKSPACES_ACTIVE_MEMBERS_EXIST: 'Remove active members before deleting this workspace.',
  WORKSPACES_ADMIN_CANNOT_LEAVE:   'Transfer ownership before leaving this workspace.',
  WORKSPACES_CANNOT_REMOVE_OWNER:  'You cannot remove the workspace owner.',
  WORKSPACES_CANNOT_UPDATE_SELF:   'You cannot update your own workspace role here.',
  WORKSPACES_INSUFFICIENT_ROLE:    'You do not have permission to perform this workspace action.',
  WORKSPACES_INVITE_ALREADY_PROCESSED: 'This invite has already been used.',
  WORKSPACES_INVITE_EXPIRED:       'This invite has expired.',
  WORKSPACES_INVITE_NOT_FOUND:     'This invite could not be found.',
  WORKSPACES_MEMBER_LIMIT_REACHED: 'This workspace has reached its member limit.',
  WORKSPACES_MEMBER_NOT_FOUND:     'This workspace member could not be found.',
  WORKSPACES_ONLY_OWNER:           'Only the workspace owner can perform this action.',
  WORKSPACES_WORKSPACE_NOT_FOUND:  'This workspace could not be found.',
};

const CHANNEL_MESSAGES: Record<string, string> = {
  CHANNELS_ALREADY_CHANNEL_MEMBER:      'This person is already a member of the channel.',
  CHANNELS_CANNOT_DELETE_GENERAL:       'The general channel cannot be deleted.',
  CHANNELS_CANNOT_JOIN_ARCHIVED:        'You cannot join an archived channel.',
  CHANNELS_CANNOT_JOIN_PRIVATE:         'You cannot join this private channel without an invite.',
  CHANNELS_CANNOT_LEAVE_GENERAL:        'You cannot leave the general channel.',
  CHANNELS_CANNOT_REMOVE_FROM_GENERAL:  'Members cannot be removed from the general channel.',
  CHANNELS_CHANNEL_MEMBER_NOT_FOUND:    'This channel member could not be found.',
  CHANNELS_CHANNEL_NAME_INVALID:        'Enter a valid channel name.',
  CHANNELS_CHANNEL_NAME_RESERVED:       'This channel name is reserved.',
  CHANNELS_CHANNEL_NOT_FOUND:           'This channel could not be found.',
  CHANNELS_CHANNEL_PRIVATE_ACCESS_DENIED: 'You do not have access to this private channel.',
  CHANNELS_DUPLICATE_CHANNEL_NAME:      'A channel with this name already exists in the workspace.',
  CHANNELS_GENERAL_CHANNEL_RENAME_FORBIDDEN: 'The general channel name cannot be changed.',
  CHANNELS_PRIVATE_MEMBER_ADD_ONLY:     'Members can only be added directly to private channels.',
  CHANNELS_USER_NOT_WORKSPACE_MEMBER:   'This person is not a member of the workspace.',
};

const MESSAGE_MESSAGES: Record<string, string> = {
  MESSAGES_CHANNEL_ARCHIVED:          'This channel is archived, so messages are unavailable.',
  MESSAGES_CHANNEL_NOT_FOUND:         'This channel could not be found.',
  MESSAGES_MESSAGE_CONTENT_REQUIRED:  'Message content cannot be empty.',
  MESSAGES_MESSAGE_DELETE_FORBIDDEN:  'You can only delete your own messages.',
  MESSAGES_MESSAGE_EDIT_FORBIDDEN:    'You can only edit your own messages.',
  MESSAGES_MESSAGE_ALREADY_PINNED:    'This message is already pinned.',
  MESSAGES_MESSAGE_NOT_FOUND:         'This message could not be found.',
  MESSAGES_MESSAGE_NOT_PINNED:        'This message is not pinned.',
  MESSAGES_PIN_FORBIDDEN:             'You do not have permission to pin messages in this channel.',
  MESSAGES_READ_ONLY_CHANNEL:         'This channel is read-only for your role.',
};

const FALLBACK = 'Something went wrong. Please try again.';

function getMappedErrorMessage(error: unknown, messages: Record<string, string>): string {
  const code = getErrorCode(error);

  if (messages[code]) {
    return messages[code];
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return FALLBACK;
}

export function getAuthErrorMessage(error: unknown): string {
  return getMappedErrorMessage(error, AUTH_MESSAGES);
}

export function getWorkspaceErrorMessage(error: unknown): string {
  return getMappedErrorMessage(error, WORKSPACE_MESSAGES);
}

export function getChannelErrorMessage(error: unknown): string {
  return getMappedErrorMessage(error, CHANNEL_MESSAGES);
}

export function getMessageErrorMessage(error: unknown): string {
  return getMappedErrorMessage(error, MESSAGE_MESSAGES);
}

export function getWorkspaceLeaveErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  if (code === 'WORKSPACES_ADMIN_CANNOT_LEAVE' || code === 'WORKSPACES_ONLY_OWNER') {
    return 'Transfer ownership before leaving this workspace.';
  }

  return getWorkspaceErrorMessage(error);
}
