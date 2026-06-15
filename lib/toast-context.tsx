'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  avatarUrl?: string;
  duration: number;
}

interface ToastCtx {
  toasts: ToastItem[];
  removing: Set<string>;
  dismiss:  (id: string) => void;
  show:     (title: string, opts?: { type?: ToastType; description?: string; duration?: number; avatarUrl?: string }) => void;
  success:  (title: string, description?: string, avatarUrl?: string) => void;
  error:    (title: string, description?: string, avatarUrl?: string) => void;
  warning:  (title: string, description?: string, avatarUrl?: string) => void;
  info:     (title: string, description?: string, avatarUrl?: string) => void;
}

const ToastContext = createContext<ToastCtx>({
  toasts: [], removing: new Set(),
  dismiss: () => {}, show: () => {},
  success: () => {}, error: () => {}, warning: () => {}, info: () => {},
});

const MAX     = 5;
const EXIT_MS = 220;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts,   setToasts]   = useState<ToastItem[]>([]);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    if (timers.current.has(id)) {
      clearTimeout(timers.current.get(id)!);
      timers.current.delete(id);
    }
    setRemoving((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setToasts((prev)   => prev.filter((t) => t.id !== id));
      setRemoving((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }, EXIT_MS);
  }, []);

  const show = useCallback((
    title: string,
    {
      type = 'default',
      description,
      duration = 3500,
      avatarUrl,
    }: {
      type?: ToastType;
      description?: string;
      duration?: number;
      avatarUrl?: string;
    } = {},
  ) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-(MAX - 1)), { id, type, title, description, avatarUrl, duration }]);
    if (duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }
  }, [dismiss]);

  const success = useCallback((t: string, d?: string, avatarUrl?: string) => show(t, { type: 'success', description: d, avatarUrl }), [show]);
  const error   = useCallback((t: string, d?: string, avatarUrl?: string) => show(t, { type: 'error',   description: d, duration: 5000, avatarUrl }), [show]);
  const warning = useCallback((t: string, d?: string, avatarUrl?: string) => show(t, { type: 'warning', description: d, avatarUrl }), [show]);
  const info    = useCallback((t: string, d?: string, avatarUrl?: string) => show(t, { type: 'info',    description: d, avatarUrl }), [show]);

  return (
    <ToastContext.Provider value={{ toasts, removing, dismiss, show, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
