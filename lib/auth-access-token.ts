'use client';

const ACCESS_TOKEN_KEY = 'tf-access-token';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredAccessToken() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(token?: string | null) {
  if (!canUseStorage()) {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}
