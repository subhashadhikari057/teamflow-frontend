'use client';

import { createPortal } from 'react-dom';
import { useToast } from '@/lib/toast-context';
import type { ToastType } from '@/lib/toast-context';
import { getUploadFileUrl } from '@/lib/api/uploads';
import Icon from './Icon';

const CONFIG: Record<ToastType, { icon: string; iconClass: string; bar: string }> = {
  success: { icon: 'checkcircle', iconClass: 'text-green-400',  bar: 'bg-green-500' },
  error:   { icon: 'xcircle',     iconClass: 'text-red-400',    bar: 'bg-red-500'   },
  warning: { icon: 'alerttri',    iconClass: 'text-amber-400',  bar: 'bg-amber-500' },
  info:    { icon: 'info',        iconClass: 'text-blue-400',   bar: 'bg-blue-500'  },
  default: { icon: 'command',     iconClass: 'text-sub',        bar: 'bg-muted'     },
};

export default function Toaster() {
  const { toasts, removing, dismiss } = useToast();

  if (typeof document === 'undefined' || toasts.length === 0) return null;

  return createPortal(
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[400] flex flex-col gap-2 items-center"
    >
      {toasts.map((toast) => {
        const cfg = CONFIG[toast.type];
        const exiting = removing.has(toast.id);
        return (
          <div
            key={toast.id}
            role="alert"
            className={`${exiting ? 'toast-exit' : 'toast-enter'} group relative flex items-start gap-3 w-[340px] pl-5 pr-4 py-3 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,#181818_0%,#111111_100%)] shadow-[0_22px_50px_rgba(0,0,0,0.55),0_10px_0_rgba(0,0,0,0.72)] overflow-hidden transition-transform duration-200 hover:-translate-y-0.5`}
          >
            <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/14" />
            <div className="pointer-events-none absolute inset-[10px] rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)] opacity-80" />

            {/* Type bar */}
            <div className={`absolute left-0 top-3 bottom-3 w-[5px] rounded-r-full shadow-[0_0_14px_rgba(255,255,255,0.12)] ${cfg.bar}`} />

            {/* Icon / Avatar */}
            {toast.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getUploadFileUrl(toast.avatarUrl)}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-[1px] ring-2 ring-white/10 shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
              />
            ) : (
              <div className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
                <Icon name={cfg.icon} size={15} className={`shrink-0 ${cfg.iconClass}`} strokeWidth={2} />
              </div>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink leading-snug drop-shadow-[0_1px_0_rgba(0,0,0,0.45)]">{toast.title}</p>
              {toast.description && (
                <p className="text-[12px] text-sub mt-0.5 leading-snug">{toast.description}</p>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 mt-[2px] rounded-full p-1 text-muted transition hover:bg-white/5 hover:text-sub"
            >
              <Icon name="x" size={13} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
