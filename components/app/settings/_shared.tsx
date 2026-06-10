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
