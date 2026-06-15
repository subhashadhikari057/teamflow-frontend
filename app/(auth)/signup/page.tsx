'use client';

import { FormEvent, Suspense, useState } from 'react';
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

type SignUpFormValues = {
  name: string;
  username: string;
  email: string;
  password: string;
};

type SignUpFormErrors = Partial<Record<keyof SignUpFormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9._]+$/;

function validateSignUpForm(values: SignUpFormValues): SignUpFormErrors {
  const errors: SignUpFormErrors = {};
  const trimmedName = values.name.trim();
  const trimmedUsername = values.username.trim();
  const normalizedEmail = values.email.trim();

  if (!trimmedName) {
    errors.name = 'Full name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  }

  if (!trimmedUsername) {
    errors.username = 'Username is required.';
  } else if (trimmedUsername.length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  } else if (!USERNAME_REGEX.test(trimmedUsername)) {
    errors.username = 'Use lowercase letters, numbers, periods, or underscores only.';
  }

  if (!normalizedEmail) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

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
  const [errors, setErrors] = useState<SignUpFormErrors>({});
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
    const values = { name, username, email, password };
    const nextErrors = validateSignUpForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.warning('Please fix the highlighted fields.');
      return;
    }

    setErrors({});
    try {
      await register.mutateAsync({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      localStorage.setItem('pending_verification_email', email.trim().toLowerCase());
      if (redirectTo !== '/workspace') {
        setPostAuthRedirect(redirectTo);
      }
      router.push(loginHref);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleRegister();
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

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => {
              const nextValue = e.target.value;
              setName(nextValue);
              if (errors.name) {
                setErrors((current) => ({ ...current, name: validateSignUpForm({ name: nextValue, username, email, password }).name }));
              }
            }}
            placeholder="Jane Smith"
            autoFocus
            autoComplete="name"
            error={errors.name}
          />
          <Field
            label="Username"
            type="text"
            value={username}
            onChange={(e) => {
              const nextValue = e.target.value.toLowerCase().replace(/\s/g, '');
              setUsername(nextValue);
              if (errors.username) {
                setErrors((current) => ({ ...current, username: validateSignUpForm({ name, username: nextValue, email, password }).username }));
              }
            }}
            placeholder="janesmith"
            autoComplete="username"
            error={errors.username}
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              const nextValue = e.target.value;
              setEmail(nextValue);
              if (errors.email) {
                setErrors((current) => ({ ...current, email: validateSignUpForm({ name, username, email: nextValue, password }).email }));
              }
            }}
            placeholder="you@company.com"
            autoComplete="email"
            error={errors.email}
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              const nextValue = e.target.value;
              setPassword(nextValue);
              if (errors.password) {
                setErrors((current) => ({ ...current, password: validateSignUpForm({ name, username, email, password: nextValue }).password }));
              }
            }}
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password}
          />
          <Button size="lg" type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

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
