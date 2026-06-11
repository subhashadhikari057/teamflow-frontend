'use client';

import { useState } from 'react';
import Icon from '@/components/primitives/Icon';

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
        on ? 'bg-white' : 'bg-elevated border border-line'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-200 ${
          on ? 'bg-black translate-x-5' : 'bg-muted translate-x-1'
        }`}
      />
    </button>
  );
}

export function ToggleRow({ label, desc, on, onToggle }: { label: string; desc?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-divider last:border-0">
      <div className="min-w-0">
        <div className="text-[14px] text-ink">{label}</div>
        {desc && <div className="text-[12px] text-sub mt-0.5">{desc}</div>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

export function Sect({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="py-6 border-b border-divider last:border-0">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {desc && <p className="text-[13px] text-sub mt-0.5 mb-4">{desc}</p>}
      {!desc && <div className="mb-4" />}
      {children}
    </div>
  );
}

export function FieldInput({ label, className = '', type, ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="block text-[13px] font-medium text-ink mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          className={`w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition ${isPassword ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted hover:text-ink transition"
            tabIndex={-1}
          >
            <Icon name={show ? 'eyeoff' : 'eye'} size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    Owner:  'bg-white text-black border-white',
    Admin:  'bg-elevated text-ink border-line',
    Member: 'bg-elevated text-sub border-divider',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${map[role] ?? map.Member}`}>
      {role}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  warning,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  icon = 'warning',
  isPending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  warning?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  icon?: React.ComponentProps<typeof Icon>['name'];
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-panel border border-line rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              tone === 'danger'
                ? 'bg-danger/10 border border-danger/20'
                : 'bg-elevated border border-line'
            }`}>
              <Icon name={icon} size={18} className={tone === 'danger' ? 'text-danger' : 'text-sub'} />
            </div>
            <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
            <p className="text-[13px] text-sub mt-1 leading-relaxed">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-muted hover:text-ink transition shrink-0 disabled:opacity-40"
            aria-label="Close dialog"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        {warning && (
          <div className="flex items-start gap-3 rounded-xl border border-[#eab308]/20 bg-[#eab308]/5 px-4 py-3">
            <Icon name="warning" size={16} className="text-[#eab308] shrink-0 mt-0.5" />
            <p className="text-[13px] text-ink leading-relaxed">{warning}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 h-9 px-4 text-sm font-medium rounded-md transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
              tone === 'danger'
                ? 'bg-danger text-white hover:bg-[#dc2626]'
                : 'bg-white text-black hover:bg-[#e0e0e0]'
            }`}
          >
            {isPending ? 'Please wait…' : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-9 px-4 text-sm font-medium rounded-md border border-line text-ink hover:border-[#555555] transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
