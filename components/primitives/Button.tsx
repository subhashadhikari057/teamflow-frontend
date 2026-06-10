'use client';

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'lift inline-flex items-center justify-center gap-2 font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer';

  const sizes = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-[15px]',
  };

  const variants = {
    primary:   'bg-white text-black hover:bg-[#e0e0e0]',
    secondary: 'bg-transparent text-ink border border-line hover:border-[#555555]',
    ghost:     'bg-transparent text-sub hover:text-ink',
    danger:    'bg-danger text-white hover:bg-[#dc2626]',
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
