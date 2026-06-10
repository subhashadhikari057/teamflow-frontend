'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import GoogleButton from '@/components/auth/GoogleButton';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { useToast } from '@/lib/toast-context';
import { useLogin } from '@/hooks/auth';
import { getAuthErrorMessage } from '@/lib/api/errors';

export default function LoginPage() {
  const router   = useRouter();
  const toast    = useToast();
  const login    = useLogin();

  const [identifier,   setIdentifier]   = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!identifier || !password) {
      toast.warning('Please fill in all fields.');
      return;
    }

    try {
      const result = await login.mutateAsync({ identifier, password });

      if (result.requiresTwoFactor) {
        // TODO: navigate to 2FA page, pass challengeToken
        toast.info('Two-factor authentication required.');
        return;
      }

      toast.success('Logged in', 'Welcome back!');
      router.push('/nomor');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

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
            label="Email or username"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@company.com"
            autoFocus
          />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-medium text-ink">Password</span>
              <Link href="/forgot-password" className="text-[12px] text-sub hover:text-ink transition">Forgot?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full h-10 px-3 pr-10 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted hover:text-ink transition"
                tabIndex={-1}
              >
                <Icon name={showPassword ? 'eyeoff' : 'eye'} size={15} />
              </button>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={handleLogin}
            disabled={login.isPending}
          >
            {login.isPending ? 'Logging in…' : 'Log in'}
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
