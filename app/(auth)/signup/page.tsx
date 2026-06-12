'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import GoogleButton from '@/components/auth/GoogleButton';
import Button from '@/components/primitives/Button';
import { authApi } from '@/lib/api/auth';
import { useRegister } from '@/hooks/auth';
import { useToast } from '@/lib/toast-context';
import { getAuthErrorMessage } from '@/lib/api/errors';
import { getPostAuthRedirect, setOauthIntent, setPostAuthRedirect } from '@/lib/auth-session-hint';

function SignUpPageContent() {
  const router  = useRouter();
  const searchParams = useSearchParams();
  const toast   = useToast();
  const register = useRegister();
  const redirectTo = searchParams.get('redirectTo') ?? getPostAuthRedirect() ?? '/workspace';

  const [name,     setName]     = useState('');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const isInviteRedirect = redirectTo.startsWith('/invite?');
  const loginHref = redirectTo === '/workspace'
    ? '/login'
    : `/login?redirectTo=${encodeURIComponent(redirectTo)}`;

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    try {
      if (redirectTo !== '/workspace') {
        setPostAuthRedirect(redirectTo);
      }
      const { url } = await authApi.getGoogleAuthUrl({ redirectUri: redirectTo, clientState: 'signup' });
      localStorage.setItem('oauth_welcome', 'google');
      setOauthIntent('signup');
      window.location.href = url;
    } catch (err) {
      setGoogleLoading(false);
      toast.error(getAuthErrorMessage(err));
    }
  }

  async function handleRegister() {
    if (!name || !username || !email || !password) {
      toast.warning('Please fill in all fields.');
      return;
    }
    try {
      await register.mutateAsync({ name, username, email, password });
      localStorage.setItem('pending_verification_email', email.trim().toLowerCase());
      if (redirectTo !== '/workspace') {
        setPostAuthRedirect(redirectTo);
      }
      router.push(loginHref);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  return (
    <AuthShell>
      <div className="rounded-lg border border-line bg-panel p-7">
        <h1 className="text-[22px] font-semibold tracking-tightest text-ink text-center">Create your account</h1>
        <p className="text-[13.5px] text-sub text-center mt-1.5 mb-6">Start collaborating in under a minute.</p>

        {isInviteRedirect && (
          <div className="rounded-xl border border-line bg-elevated px-4 py-3 text-[13px] text-sub leading-relaxed mb-5">
            Use the same email address that received this invite.
          </div>
        )}

        <GoogleButton onClick={handleGoogleSignup} loading={googleLoading}>
          Continue with Google
        </GoogleButton>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-divider" />
          <span className="text-[12px] text-muted">or continue with email</span>
          <div className="flex-1 h-px bg-divider" />
        </div>

        <div className="space-y-4">
          <Field
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            autoFocus
          />
          <Field
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            placeholder="janesmith"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          />
          <Button size="lg" className="w-full" onClick={handleRegister} disabled={register.isPending}>
            {register.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </div>

        <p className="text-center text-[12px] text-muted mt-5 leading-relaxed">
          By continuing, you agree to our{' '}
          <a href="#" className="text-sub hover:text-ink transition">Terms</a>
          {' '}and{' '}
          <a href="#" className="text-sub hover:text-ink transition">Privacy Policy</a>.
        </p>
      </div>

      <p className="text-center text-[13px] text-sub mt-5">
        Already have an account?{' '}
        <Link href={loginHref} className="text-ink hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={(
        <AuthShell>
          <div className="rounded-2xl border border-line bg-panel p-7 text-center text-[14px] text-sub">
            Loading…
          </div>
        </AuthShell>
      )}
    >
      <SignUpPageContent />
    </Suspense>
  );
}
