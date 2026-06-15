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
            className={`${exiting ? 'toast-exit' : 'toast-enter'} relative flex items-start gap-3 w-[340px] pl-5 pr-4 py-3 rounded-xl bg-[#111] border border-line shadow-2xl overflow-hidden`}
          >
            {/* Type bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${cfg.bar}`} />

            {/* Icon / Avatar */}
            {toast.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getUploadFileUrl(toast.avatarUrl)}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-[1px]"
              />
            ) : (
              <Icon name={cfg.icon} size={15} className={`shrink-0 mt-[1px] ${cfg.iconClass}`} strokeWidth={2} />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ink leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-[12px] text-sub mt-0.5 leading-snug">{toast.description}</p>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 text-muted hover:text-sub transition mt-[2px]"
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
