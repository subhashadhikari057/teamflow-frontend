'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import Button from '@/components/primitives/Button';
import { useResetPassword } from '@/hooks/auth';
import { getAuthErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/lib/toast-context';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const resetPassword = useResetPassword();

  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit() {
    if (!token) {
      toast.error('This password reset link is missing a token.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.warning('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning('Passwords do not match.');
      return;
    }

    try {
      const response = await resetPassword.mutateAsync({
        token,
        newPassword,
      });
      toast.success('Password reset', response.message);
      router.push('/login');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  const invalidLink = !token;

  return (
    <AuthShell>
      <div className="rounded-lg border border-line bg-panel p-7">
        <h1 className="text-[22px] font-semibold tracking-tightest text-ink text-center">
          Reset password
        </h1>
        <p className="text-[13.5px] text-sub text-center mt-1.5 mb-6">
          {invalidLink
            ? 'This reset link is invalid or incomplete.'
            : 'Set a new password for your account.'}
        </p>

        {invalidLink ? (
          <div className="space-y-4">
            <Button size="lg" className="w-full" onClick={() => router.push('/forgot-password')}>
              Request a new reset link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Field
              label="New password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="••••••••"
              autoFocus
            />
            <Field
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
            />

            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-[13px] text-sub mt-5">
        Back to{' '}
        <Link href="/login" className="text-ink hover:underline">
          login
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell><div className="rounded-lg border border-line bg-panel p-7 text-center text-sub">Loading reset link…</div></AuthShell>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
