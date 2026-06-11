import { clearSessionHint } from '@/lib/auth-session-hint';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',          // send HttpOnly cookies automatically
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
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
      return false;
    }

    return true;
  } catch {
    clearSessionHint();
    return false;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    if ((error as ApiError).status !== 401) throw error;

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

export const get  = <T>(path: string, init?: RequestInit) =>
  api<T>(path, { ...init, method: 'GET' });

export const post  = <T>(path: string, body?: unknown, init?: RequestInit) =>
  api<T>(path, { ...init, method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined });

export const patch = <T>(path: string, body?: unknown, init?: RequestInit) =>
  api<T>(path, { ...init, method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });

export const del   = <T>(path: string, init?: RequestInit) =>
  api<T>(path, { ...init, method: 'DELETE' });
