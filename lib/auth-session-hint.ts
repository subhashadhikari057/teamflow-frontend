'use client';

const SESSION_HINT_KEY = 'tf-has-session';

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
