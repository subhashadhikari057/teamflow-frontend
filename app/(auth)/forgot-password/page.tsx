'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import Button from '@/components/primitives/Button';
import { useForgotPassword } from '@/hooks/auth';
import { getAuthErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/lib/toast-context';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      toast.warning('Please enter your email address.');
      return;
    }

    try {
      const response = await forgotPassword.mutateAsync({ email: email.trim() });
      setSubmitted(true);
      toast.success('Email sent', response.message);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <AuthShell>
      <div className="rounded-lg border border-line bg-panel p-7">
        <h1 className="text-[22px] font-semibold tracking-tightest text-ink text-center">
          Forgot password
        </h1>
        <p className="text-[13.5px] text-sub text-center mt-1.5 mb-6">
          Enter your email and we’ll send a password reset link.
        </p>

        <div className="space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoFocus
            onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
          />

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending ? 'Sending…' : 'Send reset email'}
          </Button>
        </div>

        {submitted ? (
          <p className="text-center text-[12px] text-sub mt-5 leading-relaxed">
            Check your inbox. If the account exists, a password reset link has been sent.
          </p>
        ) : null}
      </div>

      <p className="text-center text-[13px] text-sub mt-5">
        Remembered your password?{' '}
        <Link href="/login" className="text-ink hover:underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
