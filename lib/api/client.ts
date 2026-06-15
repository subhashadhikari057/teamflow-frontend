import { clearSessionHint } from '@/lib/auth-session-hint';
import { clearStoredAccessToken, storeAccessToken } from '@/lib/auth-access-token';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';

export interface ApiRequestInit extends RequestInit {
  skipAuthRefresh?: boolean;
  skipAuthRedirect?: boolean;
}

// ─── Error type ────────────────────────────────────────────────────────────

export interface ApiError extends Error {
  code:   string;
  status: number;
}

function makeError(message: string, code: string, status: number): ApiError {
  const err = new Error(message) as ApiError;
  err.code   = code;
  err.status = status;
  return err;
}

export function getErrorCode(error: unknown): string {
  return (error as ApiError)?.code ?? 'UNKNOWN_ERROR';
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────

async function request<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { skipAuthRefresh, skipAuthRedirect, ...requestInit } = init;
  void skipAuthRefresh;
  void skipAuthRedirect;
  const headers = new Headers(requestInit.headers);
  const isFormData = requestInit.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...requestInit,
    credentials: 'include',          // send HttpOnly cookies automatically
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; errorCode?: string };
    throw makeError(
      body.message ?? res.statusText,
      body.errorCode ?? 'UNKNOWN_ERROR',
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auto-refresh on 401 ───────────────────────────────────────────────────
// All concurrent 401s share one refresh call — no thundering herd.

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    // Refresh token comes from the HttpOnly cookie automatically.
    // Backend reads it from the cookie and sets new cookies in the response.
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      clearSessionHint();
      clearStoredAccessToken();
      return false;
    }

    const body = await res.json().catch(() => null) as { tokens?: { accessToken?: string } } | null;
    storeAccessToken(body?.tokens?.accessToken);
    return true;
  } catch {
    clearSessionHint();
    clearStoredAccessToken();
    return false;
  }
}

export async function api<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    if ((error as ApiError).status !== 401) throw error;
    if (init.skipAuthRefresh) throw error;

    // Try refresh once
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    }
    const ok = await refreshPromise;
    if (!ok) {
      clearSessionHint();
      throw error;
    }

    return request<T>(path, init);
  }
}

// ─── Convenience helpers ───────────────────────────────────────────────────

export const get  = <T>(path: string, init?: ApiRequestInit) =>
  api<T>(path, { ...init, method: 'GET' });

export const post  = <T>(path: string, body?: unknown, init?: ApiRequestInit) =>
  api<T>(path, { ...init, method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined });

export const postForm = <T>(path: string, body: FormData, init?: ApiRequestInit) =>
  api<T>(path, { ...init, method: 'POST', body });

export const patch = <T>(path: string, body?: unknown, init?: ApiRequestInit) =>
  api<T>(path, { ...init, method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });

export const del   = <T>(path: string, init?: ApiRequestInit) =>
  api<T>(path, { ...init, method: 'DELETE' });
