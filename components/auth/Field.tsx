'use client';

import { useState } from 'react';
import Icon from '@/components/primitives/Icon';

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
}

export default function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoFocus,
  onKeyDown,
  error,
  autoComplete,
}: FieldProps) {
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);

  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-ink mb-1.5">{label}</span>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          className={`w-full h-10 px-3 rounded-md bg-elevated border text-[14px] text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-white/20 transition ${error ? 'border-red-400/80 focus:border-red-400' : 'border-line focus:border-[#555555]'} ${isPassword ? 'pr-10' : ''}`}
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
      {error && <span className="mt-1.5 block text-[12px] text-red-400">{error}</span>}
    </label>
  );
}
