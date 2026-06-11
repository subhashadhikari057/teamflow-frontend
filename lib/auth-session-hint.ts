'use client';

const SESSION_HINT_KEY = 'tf-has-session';
const OAUTH_WELCOME_KEY = 'oauth_welcome';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function hasSessionHint() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(SESSION_HINT_KEY) === '1';
}

export function setSessionHint() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SESSION_HINT_KEY, '1');
}

export function clearSessionHint() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_HINT_KEY);
}

export function hasPendingOauthWelcome() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(OAUTH_WELCOME_KEY) !== null;
}

export function canUsePendingOauthSession() {
  return hasPendingOauthWelcome();
}

const OAUTH_INTENT_KEY = 'tf-oauth-intent';

export type OauthIntent = 'login' | 'signup';

export function setOauthIntent(intent: OauthIntent) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(OAUTH_INTENT_KEY, intent);
}

export function getOauthIntent(): OauthIntent | null {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(OAUTH_INTENT_KEY);
  return value === 'login' || value === 'signup' ? value : null;
}

export function clearOauthIntent() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(OAUTH_INTENT_KEY);
}
