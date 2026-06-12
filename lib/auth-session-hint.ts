'use client';

import { useSyncExternalStore } from 'react';

const SESSION_HINT_KEY = 'tf-has-session';
const OAUTH_WELCOME_KEY = 'oauth_welcome';
const POST_AUTH_REDIRECT_KEY = 'tf-post-auth-redirect';
const OAUTH_INTENT_KEY = 'tf-oauth-intent';
const POST_AUTH_REDIRECT_TTL_MS = 30 * 60 * 1000;
const PENDING_VERIFICATION_EMAIL_KEY = 'pending_verification_email';

const listeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStorageItem(key: string) {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

function normalizePostAuthRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

function parseStoredPostAuthRedirect(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as {
      path?: string;
      createdAt?: number;
    };
    const normalizedPath = normalizePostAuthRedirect(parsed.path);

    if (!normalizedPath) {
      return null;
    }

    if (
      typeof parsed.createdAt === 'number'
      && Date.now() - parsed.createdAt > POST_AUTH_REDIRECT_TTL_MS
    ) {
      window.localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      return null;
    }

    return normalizedPath;
  } catch {
    return normalizePostAuthRedirect(value);
  }
}

function notifyAuthHintListeners() {
  listeners.forEach((listener) => listener());
}

function getAuthHintSnapshot() {
  return hasSessionHint() || hasPendingOauthWelcome();
}

function subscribeAuthHint(listener: () => void) {
  listeners.add(listener);

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener);
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener);
    }
  };
}

export function hasSessionHint() {
  return readStorageItem(SESSION_HINT_KEY) === '1';
}

export function setSessionHint() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SESSION_HINT_KEY, '1');
  notifyAuthHintListeners();
}

export function clearSessionHint() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_HINT_KEY);
  notifyAuthHintListeners();
}

export function hasPendingOauthWelcome() {
  return readStorageItem(OAUTH_WELCOME_KEY) !== null;
}

export function canUsePendingOauthSession() {
  return hasPendingOauthWelcome();
}

export type OauthIntent = 'login' | 'signup';

export function setOauthIntent(intent: OauthIntent) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(OAUTH_INTENT_KEY, intent);
}

export function getOauthIntent(): OauthIntent | null {
  const value = readStorageItem(OAUTH_INTENT_KEY);
  return value === 'login' || value === 'signup' ? value : null;
}

export function clearOauthIntent() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(OAUTH_INTENT_KEY);
}

export function setPostAuthRedirect(path: string) {
  if (!canUseStorage()) return;
  const normalized = normalizePostAuthRedirect(path);

  if (!normalized) {
    return;
  }

  window.localStorage.setItem(POST_AUTH_REDIRECT_KEY, JSON.stringify({
    path: normalized,
    createdAt: Date.now(),
  }));
}

export function getPostAuthRedirect() {
  return parseStoredPostAuthRedirect(readStorageItem(POST_AUTH_REDIRECT_KEY));
}

export function clearPostAuthRedirect() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
}

export function clearPendingOauthWelcome() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(OAUTH_WELCOME_KEY);
  notifyAuthHintListeners();
}

export function clearPendingVerificationEmail() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
}

export function clearAuthFlowState() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(OAUTH_WELCOME_KEY);
  window.localStorage.removeItem(OAUTH_INTENT_KEY);
  window.localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  window.localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
  notifyAuthHintListeners();
}

export function useHasAuthHint() {
  return useSyncExternalStore(subscribeAuthHint, getAuthHintSnapshot, () => false);
}
