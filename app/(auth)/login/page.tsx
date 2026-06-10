'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import GoogleButton from '@/components/auth/GoogleButton';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { useToast } from '@/lib/toast-context';
import { useLogin, useVerify2FA } from '@/hooks/auth';
import { getAuthErrorMessage } from '@/lib/api/errors';

// ─── 2FA step ─────────────────────────────────────────────────────────────────

function TwoFactorStep({
  challengeToken,
  onBack,
}: {
  challengeToken: string;
  onBack: () => void;
}) {
  const router   = useRouter();
  const toast    = useToast();
  const verify   = useVerify2FA();

  const [digits,      setDigits]      = useState(['', '', '', '', '', '']);
  const [useBackup,   setUseBackup]   = useState(false);
  const [backupCode,  setBackupCode]  = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!useBackup) inputRefs.current[0]?.focus();
  }, [useBackup]);

  function handleDigit(i: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (char && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleDigitKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === 'Enter') submit();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  async function submit() {
    try {
      if (useBackup) {
        if (!backupCode.trim()) { toast.warning('Enter your backup code.'); return; }
        await verify.mutateAsync({ challengeToken, backupCode: backupCode.trim() });
      } else {
        const code = digits.join('');
        if (code.length !== 6) { toast.warning('Enter all 6 digits.'); return; }
        await verify.mutateAsync({ challengeToken, code });
      }
      toast.success('Logged in', 'Welcome back!');
      router.push('/nomor');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
      setDigits(['', '', '', '', '', '']);
      setBackupCode('');
      inputRefs.current[0]?.focus();
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-7 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-elevated border border-line flex items-center justify-center mx-auto mb-4">
          <Icon name="shield" size={22} className="text-ink" />
        </div>
        <h1 className="text-[20px] font-semibold tracking-tightest text-ink">Two-factor authentication</h1>
        <p className="text-[13px] text-sub mt-1.5">
          {useBackup
            ? 'Enter one of your recovery backup codes.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </div>

      {/* Code input */}
      {!useBackup ? (
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleDigitKey(i, e)}
              className="w-11 h-14 rounded-xl bg-elevated border border-line text-[22px] font-mono text-ink text-center outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition caret-transparent"
            />
          ))}
        </div>
      ) : (
        <div>
          <label className="block text-[13px] font-medium text-ink mb-1.5">Backup code</label>
          <input
            autoFocus
            value={backupCode}
            onChange={e => setBackupCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="XXXXXXXXXX"
            className="w-full h-11 px-3 rounded-xl bg-elevated border border-line text-[15px] font-mono text-ink tracking-widest placeholder:text-muted placeholder:tracking-normal outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition text-center"
          />
        </div>
      )}

      {/* Verify button */}
      <Button size="lg" className="w-full" onClick={submit} disabled={verify.isPending}>
        {verify.isPending ? 'Verifying…' : 'Verify'}
      </Button>

      {/* Footer links */}
      <div className="flex items-center justify-between text-[13px]">
        <button
          type="button"
          onClick={() => { setUseBackup(v => !v); setDigits(['', '', '', '', '', '']); setBackupCode(''); }}
          className="text-sub hover:text-ink transition"
        >
          {useBackup ? 'Use authenticator code' : 'Use a backup code'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sub hover:text-ink transition"
        >
          <Icon name="arrowleft" size={13} /> Back
        </button>
      </div>
    </div>
  );
}

// ─── Login step ───────────────────────────────────────────────────────────────

function LoginStep({ onRequires2FA }: { onRequires2FA: (token: string) => void }) {
  const toast    = useToast();
  const login    = useLogin();
  const router   = useRouter();

  const [identifier,   setIdentifier]   = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!identifier || !password) { toast.warning('Please fill in all fields.'); return; }
    try {
      const result = await login.mutateAsync({ identifier, password });
      if (result.requiresTwoFactor) {
        onRequires2FA(result.challengeToken);
        return;
      }
      toast.success('Logged in', 'Welcome back!');
      router.push('/nomor');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-7">
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
          onChange={e => setIdentifier(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
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
        <Button size="lg" className="w-full" onClick={handleLogin} disabled={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  return (
    <AuthShell>
      {challengeToken ? (
        <TwoFactorStep
          challengeToken={challengeToken}
          onBack={() => setChallengeToken(null)}
        />
      ) : (
        <LoginStep onRequires2FA={setChallengeToken} />
      )}

      {!challengeToken && (
        <p className="text-center text-[13px] text-sub mt-5">
          New to Teamflow?{' '}
          <Link href="/signup" className="text-ink hover:underline">Create an account</Link>
        </p>
      )}
    </AuthShell>
  );
}
