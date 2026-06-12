'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Button from '@/components/primitives/Button';
import { useVerifyEmail } from '@/hooks/auth/useVerifyEmail';
import { getAuthErrorMessage } from '@/lib/api/errors';
import { getPostAuthRedirect } from '@/lib/auth-session-hint';
import { useToast } from '@/lib/toast-context';

type VerificationState = 'verifying' | 'success' | 'error' | 'missing-token';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const verifyEmail = useVerifyEmail();
  const hasAttemptedRef = useRef(false);
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const postAuthRedirect = getPostAuthRedirect();
  const loginHref = postAuthRedirect
    ? `/login?redirectTo=${encodeURIComponent(postAuthRedirect)}`
    : '/login';
  const isInviteRedirect = postAuthRedirect?.startsWith('/invite?') ?? false;
  const [state, setState] = useState<VerificationState>(
    token ? 'verifying' : 'missing-token',
  );
  const [message, setMessage] = useState(
    token ? 'Verifying your email address…' : 'This verification link is missing a token.',
  );

  useEffect(() => {
    if (!token || hasAttemptedRef.current) {
      return;
    }

    hasAttemptedRef.current = true;

    void (async () => {
      try {
        const response = await verifyEmail.mutateAsync({ token });
        setState('success');
        setMessage(response.message);
        toast.success('Email verified', response.message);
      } catch (error) {
        setState('error');
        setMessage(getAuthErrorMessage(error));
        toast.error(getAuthErrorMessage(error));
      }
    })();
  }, [toast, token, verifyEmail]);

  function goToLogin() {
    router.push(loginHref);
  }

  return (
    <AuthShell>
      <div className="rounded-lg border border-line bg-panel p-7">
        <h1 className="text-[22px] font-semibold tracking-tightest text-ink text-center">
          Verify email
        </h1>
        <p className="text-[13.5px] text-sub text-center mt-1.5 mb-6">
          {message}
        </p>

        {state === 'success' && isInviteRedirect && (
          <div className="rounded-xl border border-line bg-elevated px-4 py-3 text-[13px] text-sub leading-relaxed mb-6">
            Log in with the same email address that received this invite.
          </div>
        )}

        <div className="space-y-4">
          {state === 'verifying' ? (
            <Button size="lg" className="w-full" disabled>
              Verifying…
            </Button>
          ) : null}

          {state === 'success' ? (
            <Button size="lg" className="w-full" onClick={goToLogin}>
              Continue to login
            </Button>
          ) : null}

          {state === 'error' || state === 'missing-token' ? (
            <Button size="lg" className="w-full" onClick={() => router.push(loginHref)}>
              Back to login
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-center text-[13px] text-sub mt-5">
        Back to{' '}
        <Link href={loginHref} className="text-ink hover:underline">
          login
        </Link>
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={(
        <AuthShell>
          <div className="rounded-lg border border-line bg-panel p-7 text-center text-sub">
            Loading verification link…
          </div>
        </AuthShell>
      )}
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
