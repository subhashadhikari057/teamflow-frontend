'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { ConfirmDialog, FieldInput } from './_shared';
import {
  useChangePassword,
  useCurrentUser,
  useEnable2FA,
  useConfirm2FA,
  useDisable2FA,
  useRegenerateBackupCodes,
  useSessions,
  useRevokeSession,
  useRevokeAllSessions,
  useLogout,
} from '@/hooks/auth';
import { useToast } from '@/lib/toast-context';
import { getAuthErrorMessage } from '@/lib/api/errors';
import { authApi } from '@/lib/api/auth';
import type { SessionItem } from '@/lib/api/types';

// ─── Change password ──────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const router         = useRouter();
  const toast          = useToast();
  const changePassword = useChangePassword();

  const [open,      setOpen]      = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  function cancel() {
    setOpen(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  }

  async function submit() {
    if (!currentPw || !newPw || !confirmPw) { toast.warning('Fill in all fields.'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match.'); return; }
    try {
      await changePassword.mutateAsync({ currentPassword: currentPw, newPassword: newPw });
      await authApi.logout().catch(() => {});
      toast.success('Password changed. Please log in again.');
      router.push('/login');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  return (
    <div className="py-6 border-b border-divider">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-elevated border border-line flex items-center justify-center shrink-0">
              <Icon name="lock" size={14} className="text-sub" />
            </div>
            <span className="text-[14px] font-medium text-ink">Password</span>
          </div>
          <p className="text-[13px] text-sub mt-1.5 ml-10">
            Update your password to keep your account secure.
          </p>
        </div>
        {!open && (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            Change
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-5 ml-10 space-y-4 max-w-sm">
          <FieldInput label="Current password"     type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" autoFocus />
          <FieldInput label="New password"         type="password" value={newPw}     onChange={e => setNewPw(e.target.value)}     placeholder="••••••••" />
          <FieldInput label="Confirm new password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
          <div className="flex gap-2 pt-1">
            <Button onClick={submit} disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating…' : 'Update password'}
            </Button>
            <Button variant="secondary" onClick={cancel} disabled={changePassword.isPending}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sessions ────────────────────────────────────────────────────────────────

function formatSessionDate(value?: string) {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getSessionTitle(session: SessionItem) {
  return session.deviceName || session.deviceType || 'Unknown device';
}

function getSessionMeta(session: SessionItem) {
  const parts = [
    session.userAgent,
    session.location,
    session.ipAddress,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : 'Location unavailable';
}

function SessionRow({
  session,
  onRevoke,
  isRevoking,
}: {
  session: SessionItem;
  onRevoke?: () => void;
  isRevoking?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-elevated/40 p-4 flex items-start justify-between gap-4">
      <div className="min-w-0 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-panel border border-line flex items-center justify-center shrink-0">
          <Icon name="hardware" size={16} className="text-sub" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-medium text-ink">{getSessionTitle(session)}</p>
            {session.isCurrent && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-white/15 bg-white/8 text-ink">
                Current
              </span>
            )}
          </div>
          <p className="text-[12px] text-sub mt-1">{getSessionMeta(session)}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-muted">
            <span>Last active: {formatSessionDate(session.lastActiveAt)}</span>
            <span>Started: {formatSessionDate(session.createdAt)}</span>
            <span>Expires: {formatSessionDate(session.expiresAt)}</span>
          </div>
        </div>
      </div>

      {!session.isCurrent && onRevoke && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRevoke}
          disabled={isRevoking}
          className="shrink-0 self-center whitespace-nowrap min-w-[124px]"
        >
          {isRevoking ? 'Ending…' : 'End session'}
        </Button>
      )}
    </div>
  );
}

function SessionsSection() {
  const toast = useToast();
  const router = useRouter();
  const sessions = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();
  const logout = useLogout();
  const [confirmAction, setConfirmAction] = useState<'current' | 'others' | null>(null);

  const items = sessions.data?.items ?? [];
  const currentSession = items.find((session) => session.isCurrent) ?? null;
  const otherSessions = items.filter((session) => !session.isCurrent);

  async function handleRevokeSession(sessionId: string) {
    try {
      await revokeSession.mutateAsync(sessionId);
      toast.success('Session ended.');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  async function handleRevokeAll() {
    try {
      await revokeAllSessions.mutateAsync();
      toast.success('Other sessions signed out.');
      setConfirmAction(null);
      await sessions.refetch();
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  async function handleSignOutCurrent() {
    try {
      await logout.mutateAsync();
      toast.success('Signed out of this device.');
      setConfirmAction(null);
      router.push('/login');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  return (
    <div className="py-6 border-b border-divider">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-elevated border border-line flex items-center justify-center shrink-0">
          <Icon name="hardware" size={14} className="text-sub" />
        </div>
        <span className="text-[14px] font-medium text-ink">Sessions</span>
      </div>
      <p className="text-[13px] text-sub mb-5 ml-10">
        Review where your account is signed in and end sessions you no longer trust.
      </p>

      <div className="ml-10 space-y-4">
        <div className="rounded-xl border border-line overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-divider">
            <div>
              <p className="text-[14px] font-medium text-ink">Active devices</p>
              <p className="text-[12px] text-sub mt-0.5">
                {sessions.isLoading ? 'Checking your active sessions…' : `${items.length} active session${items.length === 1 ? '' : 's'} found`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => sessions.refetch()}
                disabled={sessions.isFetching}
              >
                <Icon name="refresh" size={13} /> {sessions.isFetching ? 'Refreshing…' : 'Refresh'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmAction('others')}
                disabled={revokeAllSessions.isPending || otherSessions.length === 0}
              >
                {revokeAllSessions.isPending ? 'Ending…' : 'Sign out other sessions'}
              </Button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {sessions.isLoading && (
              <div className="rounded-xl border border-line bg-elevated/30 px-4 py-5 text-[13px] text-sub">
                Loading session details…
              </div>
            )}

            {sessions.isError && (
              <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-5 text-[13px] text-sub">
                We couldn&apos;t load your active sessions right now.
              </div>
            )}

            {!sessions.isLoading && !sessions.isError && currentSession && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold tracking-[0.12em] text-muted">THIS DEVICE</p>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmAction('current')}>
                    <Icon name="logout" size={13} /> Sign out
                  </Button>
                </div>
                <SessionRow session={currentSession} />
              </div>
            )}

            {!sessions.isLoading && !sessions.isError && (
              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.12em] text-muted">OTHER SESSIONS</p>

                {otherSessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line px-4 py-5 text-[13px] text-sub">
                    No other active sessions right now.
                  </div>
                ) : (
                  otherSessions.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      onRevoke={() => handleRevokeSession(session.id)}
                      isRevoking={revokeSession.isPending && revokeSession.variables === session.id}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === 'others'}
        title="Sign out other sessions?"
        description="This will end every active session except the one you are using right now."
        confirmLabel="Sign out other sessions"
        icon="hardware"
        isPending={revokeAllSessions.isPending}
        onConfirm={handleRevokeAll}
        onClose={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === 'current'}
        title="Sign out of this device?"
        description="You will be logged out immediately and need to sign in again to continue."
        warning="If you are on a shared or temporary device, make sure you know your login details before continuing."
        confirmLabel="Sign out"
        icon="logout"
        isPending={logout.isPending}
        onConfirm={handleSignOutCurrent}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}

// ─── Backup codes ─────────────────────────────────────────────────────────────

function BackupCodeGrid({ codes, isNew }: { codes: string[]; isNew?: boolean }) {
  const toast = useToast();

  function copyAll() {
    navigator.clipboard.writeText(codes.join('\n'));
    toast.success('Backup codes copied');
  }

  function download() {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'teamflow-backup-codes.txt'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-line bg-elevated overflow-hidden">
      <div className="px-4 py-3 border-b border-divider flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="shield" size={14} className="text-sub" />
          <span className="text-[13px] font-medium text-ink">
            {isNew ? 'New backup codes' : 'Backup codes'}
          </span>
          <span className="text-[11px] text-muted bg-panel border border-divider px-1.5 py-0.5 rounded-md">
            {codes.length} codes · one-time use
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={copyAll} className="h-7 px-2.5 flex items-center gap-1.5 rounded-md text-[12px] text-sub hover:text-ink hover:bg-panel border border-transparent hover:border-line transition">
            <Icon name="copy" size={12} /> Copy
          </button>
          <button onClick={download} className="h-7 px-2.5 flex items-center gap-1.5 rounded-md text-[12px] text-sub hover:text-ink hover:bg-panel border border-transparent hover:border-line transition">
            <Icon name="download" size={12} /> Download
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-divider">
        {codes.map((c, i) => (
          <div key={c} className="bg-elevated px-4 py-2.5 flex items-center justify-between group">
            <span className="text-[11px] text-muted w-4 shrink-0">{i + 1}</span>
            <code className="text-[13px] font-mono text-ink tracking-widest select-all flex-1 text-center">{c}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2FA setup flow ───────────────────────────────────────────────────────────

function TwoFactorSetupFlow({ onDone }: { onDone: (codes: string[]) => void }) {
  const toast   = useToast();
  const enable  = useEnable2FA();
  const confirm = useConfirm2FA();

  const [step,       setStep]       = useState<'idle' | 'scan' | 'verify'>('idle');
  const [qrData,     setQrData]     = useState<{ qrCodeUrl: string; secret: string } | null>(null);
  const [code,       setCode]       = useState('');
  const [showManual, setShowManual] = useState(false);

  async function startSetup() {
    try {
      const data = await enable.mutateAsync();
      setQrData({ qrCodeUrl: data.qrCodeUrl, secret: data.secret });
      setStep('scan');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  async function verifyCode() {
    const trimmed = code.trim();
    if (trimmed.length !== 6 || !/^\d+$/.test(trimmed)) {
      toast.warning('Enter the 6-digit code from your authenticator app.');
      return;
    }
    try {
      const data = await confirm.mutateAsync({ code: trimmed });
      onDone(data.codes);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  function cancel() { setStep('idle'); setCode(''); setQrData(null); setShowManual(false); }

  if (step === 'idle') {
    return (
      <div className="rounded-xl border border-dashed border-line p-6 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-elevated border border-line flex items-center justify-center">
          <Icon name="shield" size={22} className="text-sub" />
        </div>
        <div>
          <p className="text-[14px] font-medium text-ink">Not enabled</p>
          <p className="text-[13px] text-sub mt-1 max-w-xs">
            Protect your account with an authenticator app. You&apos;ll need a code each time you log in.
          </p>
        </div>
        <Button onClick={startSetup} disabled={enable.isPending}>
          {enable.isPending ? 'Generating…' : 'Set up two-factor auth'}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line overflow-hidden">
      {/* Step indicators */}
      <div className="flex border-b border-divider">
        {(['scan', 'verify'] as const).map((s, i) => (
          <div
            key={s}
            className={`flex-1 flex items-center gap-2 px-4 py-3 text-[13px] transition ${step === s ? 'text-ink' : 'text-muted'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition ${step === s ? 'bg-white text-black' : step === 'verify' && s === 'scan' ? 'bg-elevated border border-line text-sub' : 'bg-elevated border border-line text-muted'}`}>
              {step === 'verify' && s === 'scan' ? <Icon name="check" size={11} /> : i + 1}
            </span>
            {s === 'scan' ? 'Scan QR code' : 'Verify code'}
          </div>
        ))}
      </div>

      <div className="p-6">
        {step === 'scan' && qrData && (
          <div className="flex gap-8 flex-wrap">
            {/* QR code */}
            <div className="shrink-0">
              <div className="inline-block p-3 bg-white rounded-xl shadow-sm">
                <img src={qrData.qrCodeUrl} alt="2FA QR code" width={176} height={176} className="block" />
              </div>
            </div>

            {/* Instructions */}
            <div className="flex-1 min-w-[200px] flex flex-col justify-between gap-5">
              <div>
                <p className="text-[14px] font-medium text-ink mb-2">Scan with your authenticator app</p>
                <p className="text-[13px] text-sub leading-relaxed">
                  Open Google Authenticator, Authy, 1Password, or any TOTP app and scan this code.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowManual(v => !v)}
                  className="flex items-center gap-1.5 text-[12px] text-muted hover:text-sub transition"
                >
                  <Icon name={showManual ? 'chevup' : 'chevdown'} size={12} />
                  Can&apos;t scan? Enter key manually
                </button>
                {showManual && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-[12px] font-mono text-sub bg-elevated border border-line rounded-md px-2.5 py-1.5 tracking-wider select-all break-all">
                      {qrData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(qrData.secret); toast.success('Key copied'); }}
                      className="text-muted hover:text-ink transition shrink-0"
                    >
                      <Icon name="copy" size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep('verify')}>Continue</Button>
                <Button variant="secondary" onClick={cancel}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="max-w-sm space-y-5">
            <div>
              <p className="text-[14px] font-medium text-ink mb-1">Enter the 6-digit code</p>
              <p className="text-[13px] text-sub">Open your authenticator app and enter the code shown for Teamflow.</p>
            </div>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyCode()}
              placeholder="000 000"
              maxLength={6}
              autoFocus
              className="w-full h-12 rounded-xl bg-elevated border border-line text-[22px] text-ink font-mono tracking-[0.4em] placeholder:text-muted placeholder:tracking-normal outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/10 transition text-center"
            />
            <div className="flex gap-2">
              <Button onClick={verifyCode} disabled={confirm.isPending}>
                {confirm.isPending ? 'Verifying…' : 'Activate 2FA'}
              </Button>
              <Button variant="secondary" onClick={() => setStep('scan')}>Back</Button>
              <Button variant="secondary" onClick={cancel}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Regenerate modal ─────────────────────────────────────────────────────────

function RegenerateModal({ onClose, onDone }: { onClose: () => void; onDone: (codes: string[]) => void }) {
  const toast      = useToast();
  const regenerate = useRegenerateBackupCodes();
  const [pw, setPw] = useState('');

  async function submit() {
    if (!pw) { toast.warning('Enter your current password.'); return; }
    try {
      const data = await regenerate.mutateAsync({ password: pw });
      onDone(data.codes);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-panel border border-line rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-elevated border border-line flex items-center justify-center mb-3">
              <Icon name="refresh" size={18} className="text-sub" />
            </div>
            <h3 className="text-[16px] font-semibold text-ink">Regenerate backup codes</h3>
            <p className="text-[13px] text-sub mt-1 leading-relaxed">
              Your existing backup codes will be invalidated. Enter your password to confirm.
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition shrink-0">
            <Icon name="x" size={16} />
          </button>
        </div>
        <FieldInput
          label="Current password"
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && submit()}
          placeholder="••••••••"
          autoFocus
        />
        <div className="flex gap-2">
          <Button onClick={submit} disabled={regenerate.isPending} className="flex-1">
            {regenerate.isPending ? 'Regenerating…' : 'Regenerate codes'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={regenerate.isPending}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── 2FA enabled state ────────────────────────────────────────────────────────

function TwoFactorEnabledPanel({
  onRegenerate,
  onDisable,
}: {
  onRegenerate: () => void;
  onDisable: () => void;
}) {
  return (
    <div className="rounded-xl border border-line overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-divider">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
          <Icon name="check" size={14} className="text-[#22c55e]" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-medium text-ink">Two-factor authentication is on</p>
          <p className="text-[12px] text-sub mt-0.5">Your account is protected with an authenticator app.</p>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border" style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)' }}>
          Active
        </span>
      </div>

      <div className="divide-y divide-divider">
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-ink">Backup codes</p>
            <p className="text-[12px] text-sub mt-0.5">10 single-use codes for account recovery. Regenerate to get a fresh set.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onRegenerate}>
            <Icon name="refresh" size={13} /> Regenerate
          </Button>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-ink">Disable 2FA</p>
            <p className="text-[12px] text-sub mt-0.5">Removes the authenticator requirement on login.</p>
          </div>
          <Button variant="danger" size="sm" onClick={onDisable}>
            Disable
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Disable modal ────────────────────────────────────────────────────────────

function TwoFactorDisableModal({ onClose, onDisabled }: { onClose: () => void; onDisabled: () => void }) {
  const toast   = useToast();
  const disable = useDisable2FA();
  const [pw, setPw] = useState('');

  async function submit() {
    if (!pw) { toast.warning('Enter your current password.'); return; }
    try {
      await disable.mutateAsync({ password: pw });
      toast.success('Two-factor authentication disabled.');
      onDisabled();
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-panel border border-line rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-3">
              <Icon name="shield" size={18} className="text-danger" />
            </div>
            <h3 className="text-[16px] font-semibold text-ink">Disable two-factor auth?</h3>
            <p className="text-[13px] text-sub mt-1 leading-relaxed">
              Your account will only be protected by your password. Enter it below to confirm.
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition shrink-0">
            <Icon name="x" size={16} />
          </button>
        </div>
        <FieldInput
          label="Current password"
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && submit()}
          placeholder="••••••••"
          autoFocus
        />
        <div className="flex gap-2">
          <Button variant="danger" onClick={submit} disabled={disable.isPending} className="flex-1">
            {disable.isPending ? 'Disabling…' : 'Yes, disable 2FA'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={disable.isPending}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── 2FA section ─────────────────────────────────────────────────────────────

function TwoFactorSection() {
  const user = useCurrentUser();

  const [backupCodes,      setBackupCodes]      = useState<string[] | null>(null);
  const [setupDone,        setSetupDone]        = useState(false);
  const [showDisable,      setShowDisable]      = useState(false);
  const [showRegenerate,   setShowRegenerate]   = useState(false);

  const isEnabled = user?.twoFactorEnabled ?? false;

  function handleSetupDone(codes: string[]) {
    setBackupCodes(codes);
    setSetupDone(true);
  }

  function dismissCodes() {
    setBackupCodes(null);
    setSetupDone(false);
  }

  return (
    <div className="py-6 border-b border-divider">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-elevated border border-line flex items-center justify-center shrink-0">
          <Icon name="shield" size={14} className="text-sub" />
        </div>
        <span className="text-[14px] font-medium text-ink">Two-factor authentication</span>
      </div>
      <p className="text-[13px] text-sub mb-5 ml-10">
        Require a one-time code from your authenticator app in addition to your password.
      </p>

      <div className="ml-10 space-y-4">
        {/* Not enabled */}
        {!isEnabled && !setupDone && (
          <TwoFactorSetupFlow onDone={handleSetupDone} />
        )}

        {/* Just enabled — show backup codes */}
        {setupDone && backupCodes && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5">
              <Icon name="checkcircle" size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
              <p className="text-[13px] text-ink">
                <strong>2FA is now active.</strong> Save your backup codes — if you lose access to your authenticator app, these are the only way to recover your account.
              </p>
            </div>
            <BackupCodeGrid codes={backupCodes} isNew />
            <Button variant="secondary" size="sm" onClick={dismissCodes}>Done, I&apos;ve saved my codes</Button>
          </div>
        )}

        {/* Enabled: management panel */}
        {isEnabled && !backupCodes && !setupDone && (
          <TwoFactorEnabledPanel
            onRegenerate={() => setShowRegenerate(true)}
            onDisable={() => setShowDisable(true)}
          />
        )}

        {/* Enabled + just regenerated */}
        {isEnabled && backupCodes && !setupDone && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-[#eab308]/20 bg-[#eab308]/5">
              <Icon name="warning" size={16} className="text-[#eab308] shrink-0 mt-0.5" />
              <p className="text-[13px] text-ink">
                <strong>Your previous backup codes are now invalid.</strong> Save these new codes somewhere safe.
              </p>
            </div>
            <BackupCodeGrid codes={backupCodes} isNew />
            <Button variant="secondary" size="sm" onClick={dismissCodes}>Done, I&apos;ve saved my codes</Button>
          </div>
        )}
      </div>

      {showRegenerate && (
        <RegenerateModal
          onClose={() => setShowRegenerate(false)}
          onDone={(codes) => { setShowRegenerate(false); setBackupCodes(codes); }}
        />
      )}

      {showDisable && (
        <TwoFactorDisableModal
          onClose={() => setShowDisable(false)}
          onDisabled={() => { setShowDisable(false); setBackupCodes(null); }}
        />
      )}
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export default function SecurityTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[20px] font-semibold tracking-tightest text-ink">Security</h2>
        <p className="text-[13px] text-sub mt-0.5">Manage your password and account security settings.</p>
      </div>

      <ChangePasswordSection />
      <TwoFactorSection />
      <SessionsSection />
    </div>
  );
}
