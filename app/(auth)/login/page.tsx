'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import GoogleButton from '@/components/auth/GoogleButton';
import Button from '@/components/primitives/Button';
import { useToast } from '@/lib/toast-context';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthShell>
      <div className="rounded-lg border border-line bg-panel p-7">
        <h1 className="text-[22px] font-semibold tracking-tightest text-ink text-center">Welcome back</h1>
        <p className="text-[13.5px] text-sub text-center mt-1.5 mb-6">Log in to your workspace.</p>

        <GoogleButton>Continue with Google</GoogleButton>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-divider" />
          <span className="text-[12px] text-muted">or continue with email</span>
          <div className="flex-1 h-px bg-divider" />
        </div>

        <div className="space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoFocus
          />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-medium text-ink">Password</span>
              <a href="#" className="text-[12px] text-sub hover:text-ink transition">Forgot?</a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition"
            />
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              toast.success('Logged in', 'Welcome back to your workspace');
              setTimeout(() => router.push('/nomor'), 900);
            }}
          >
            Log in
          </Button>
        </div>
      </div>

      <p className="text-center text-[13px] text-sub mt-5">
        New to Teamflow?{' '}
        <Link href="/signup" className="text-ink hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
