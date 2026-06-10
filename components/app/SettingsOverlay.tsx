'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import Button from '@/components/primitives/Button';
import Logo from '@/components/primitives/Logo';
import { MEMBERS, USERS, CURRENT_USER } from '@/lib/data';
import { useAppearance } from '@/lib/appearance-context';
import { useCurrentUser, useMe, useChangePassword, useUpdateProfile } from '@/hooks/auth';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/lib/toast-context';
import { getAuthErrorMessage } from '@/lib/api/errors';
import type { UserStatus } from '@/lib/api/types';

// ─────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
        on ? 'bg-white' : 'bg-elevated border border-line'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-200 ${
          on ? 'bg-black translate-x-5' : 'bg-muted translate-x-1'
        }`}
      />
    </button>
  );
}

function ToggleRow({ label, desc, on, onToggle }: { label: string; desc?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-divider last:border-0">
      <div className="min-w-0">
        <div className="text-[14px] text-ink">{label}</div>
        {desc && <div className="text-[12px] text-sub mt-0.5">{desc}</div>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function Sect({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="py-6 border-b border-divider last:border-0">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {desc && <p className="text-[13px] text-sub mt-0.5 mb-4">{desc}</p>}
      {!desc && <div className="mb-4" />}
      {children}
    </div>
  );
}

function FieldInput({ label, className = '', type, ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="block text-[13px] font-medium text-ink mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          className={`w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition ${isPassword ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted hover:text-ink transition"
            tabIndex={-1}
          >
            <Icon name={show ? 'eyeoff' : 'eye'} size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    Owner:  'bg-white text-black border-white',
    Admin:  'bg-elevated text-ink border-line',
    Member: 'bg-elevated text-sub border-divider',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${map[role] ?? map.Member}`}>
      {role}
    </span>
  );
}

// ─────────────────────────────────────────
// Profile
// ─────────────────────────────────────────

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'ONLINE',         label: 'Online',          color: '#22c55e' },
  { value: 'AWAY',           label: 'Away',            color: '#eab308' },
  { value: 'BUSY',           label: 'Busy',            color: '#ef4444' },
  { value: 'DO_NOT_DISTURB', label: 'Do Not Disturb',  color: '#ef4444' },
  { value: 'FOCUSING',       label: 'Focusing',        color: '#a855f7' },
  { value: 'IN_A_MEETING',   label: 'In a Meeting',    color: '#3b82f6' },
  { value: 'ON_VACATION',    label: 'On Vacation',     color: '#14b8a6' },
  { value: 'OUT_OF_OFFICE',  label: 'Out of Office',   color: '#f97316' },
  { value: 'OFFLINE',        label: 'Offline',         color: '#6b7280' },
];

const TIMEZONES = [
  'Pacific/Midway', 'Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles',
  'America/Denver', 'America/Chicago', 'America/New_York', 'America/Sao_Paulo',
  'Atlantic/Azores', 'Europe/London', 'Europe/Paris', 'Europe/Istanbul',
  'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Kathmandu',
  'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];


function StatusSelect({ value, onChange }: { value: UserStatus | ''; onChange: (v: UserStatus | '') => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = STATUS_OPTIONS.find(o => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-9 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink outline-none focus:border-[#555555] transition flex items-center justify-between gap-2"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: selected.color }} />
            {selected.label}
          </span>
        ) : (
          <span className="text-muted">— Select —</span>
        )}
        <Icon name="chevdown" size={14} className="text-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-line bg-panel shadow-lg overflow-hidden">
          {STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 h-9 text-[14px] text-left hover:bg-elevated transition ${value === o.value ? 'text-ink' : 'text-sub'}`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: o.color }} />
              {o.label}
              {value === o.value && <Icon name="check" size={13} className="ml-auto text-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab() {
  const user          = useCurrentUser();
  const { isLoading } = useMe();
  const toast         = useToast();
  const updateProfile = useUpdateProfile();

  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [status,   setStatus]   = useState<UserStatus | ''>('');
  const [timezone, setTimezone] = useState('');

  function syncFromUser() {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? '');
      setStatus(user.status ?? '');
      setTimezone(user.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }

  useEffect(() => { syncFromUser(); }, [user]);

  function cancel() {
    syncFromUser();
    setEditing(false);
  }

  async function save() {
    try {
      await updateProfile.mutateAsync({
        name,
        phone,
        status: status || undefined,
        timezone,
      });
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile. Please try again.');
    }
  }

  const initials = user?.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?';

  const statusOption = STATUS_OPTIONS.find(o => o.value === user?.status);
  const timezoneLabel = user?.timezone?.replace(/_/g, ' ') ?? '—';

  const inputClass = 'w-full h-9 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition';
  const selectClass = 'w-full h-9 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink outline-none focus:border-[#555555] transition cursor-pointer';

  if (isLoading) {
    return <div className="text-[14px] text-sub py-10 text-center">Loading…</div>;
  }

  return (
    <div>
      {/* Avatar + identity header */}
      <div className="flex items-center gap-5 pb-7 border-b border-divider">
        <div className="relative shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-elevated border border-line flex items-center justify-center text-ink font-semibold text-2xl select-none">
              {initials}
            </div>
          )}
          {editing && (
            <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-panel border border-line flex items-center justify-center text-sub hover:text-ink transition shadow-sm">
              <Icon name="compose" size={12} />
            </button>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[20px] font-semibold tracking-tightest text-ink truncate">{user?.name}</div>
          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            <span className="text-[13px] text-sub">@{user?.username}</span>
            {statusOption && (
              <>
                <span className="text-muted">·</span>
                <span className="flex items-center gap-1.5 text-[13px] text-sub">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusOption.color }} />
                  {statusOption.label}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Field rows */}
      <div className="divide-y divide-divider">
        {/* Display name */}
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Display name</span>
          {editing ? (
            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          ) : (
            <span className="text-[14px] text-ink">{user?.name ?? '—'}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Email</span>
          <span className="text-[14px] text-ink">{user?.email ?? '—'}</span>
        </div>

        {/* Username */}
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Username</span>
          <span className="text-[14px] text-ink">@{user?.username ?? '—'}</span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Phone</span>
          {editing ? (
            <input className={inputClass} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          ) : (
            <span className="text-[14px] text-ink">{user?.phone || '—'}</span>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Status</span>
          {editing ? (
            <StatusSelect value={status} onChange={setStatus} />
          ) : (
            <span className="flex items-center gap-2 text-[14px] text-ink">
              {statusOption ? (
                <>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusOption.color }} />
                  {statusOption.label}
                </>
              ) : '—'}
            </span>
          )}
        </div>

        {/* Timezone */}
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Timezone</span>
          {editing ? (
            <select className={selectClass} value={timezone} onChange={e => setTimezone(e.target.value)}>
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          ) : (
            <span className="text-[14px] text-ink">{timezoneLabel}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end pt-4 gap-3">
        {editing ? (
          <>
            <Button variant="secondary" onClick={cancel} disabled={updateProfile.isPending}>Cancel</Button>
            <Button onClick={save} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Icon name="compose" size={13} /> Edit profile
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Security
// ─────────────────────────────────────────

function SecurityTab() {
  const router = useRouter();
  const toast = useToast();
  const changePassword = useChangePassword();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      toast.warning('Please fill in all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match.');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: currentPw, newPassword: newPw });
      // Backend revoked all sessions but the HttpOnly cookies are still in the browser.
      // Call logout so the backend sends Set-Cookie headers that clear them, otherwise
      // the proxy will see the old access_token and redirect away from /login.
      await authApi.logout().catch(() => {});
      toast.success('Password changed', 'Please log in again.');
      router.push('/login');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Security</h2>
      <p className="text-[13px] text-sub mb-0">Manage your password and account security.</p>

      <Sect title="Change password">
        <div className="space-y-4">
          <FieldInput
            label="Current password"
            type="password"
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
            placeholder="••••••••"
          />
          <FieldInput
            label="New password"
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="••••••••"
          />
          <FieldInput
            label="Confirm new password"
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="••••••••"
          />
          <Button onClick={handleChangePassword} disabled={changePassword.isPending}>
            {changePassword.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </Sect>
    </div>
  );
}

// ─────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────

function NotificationsTab() {
  const [notify, setNotify] = useState({ dms: true, mentions: true, threads: true, reactions: false });
  const [desktop, setDesktop] = useState({ enabled: true, sound: true, preview: true });
  const [email, setEmail]   = useState({ digest: false, weekly: false });
  const [keyword, setKeyword] = useState('');
  const [keywords, setKeywords] = useState(['release', 'deploy', 'incident']);

  function addKeyword() {
    const k = keyword.trim();
    if (k && !keywords.includes(k)) setKeywords(prev => [...prev, k]);
    setKeyword('');
  }

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Notifications</h2>
      <p className="text-[13px] text-sub mb-0">Choose when and how you want to be notified.</p>

      <Sect title="Notify me about">
        <ToggleRow label="Direct messages" desc="Always notify for DMs, even when active" on={notify.dms} onToggle={() => setNotify(n => ({ ...n, dms: !n.dms }))} />
        <ToggleRow label="@mentions" desc="When someone mentions you by name" on={notify.mentions} onToggle={() => setNotify(n => ({ ...n, mentions: !n.mentions }))} />
        <ToggleRow label="Thread replies" desc="Replies in threads you participated in" on={notify.threads} onToggle={() => setNotify(n => ({ ...n, threads: !n.threads }))} />
        <ToggleRow label="Reactions" desc="When someone reacts to your message" on={notify.reactions} onToggle={() => setNotify(n => ({ ...n, reactions: !n.reactions }))} />
      </Sect>

      <Sect title="Desktop" desc="Browser notifications while the app is in the background">
        <ToggleRow label="Enable desktop notifications" on={desktop.enabled} onToggle={() => setDesktop(d => ({ ...d, enabled: !d.enabled }))} />
        <ToggleRow label="Play a sound" on={desktop.sound} onToggle={() => setDesktop(d => ({ ...d, sound: !d.sound }))} />
        <ToggleRow label="Show message preview" desc="Include message content in the notification" on={desktop.preview} onToggle={() => setDesktop(d => ({ ...d, preview: !d.preview }))} />
      </Sect>

      <Sect title="Email" desc="Delivered to your inbox when you're away">
        <ToggleRow label="Daily digest" desc="Summary of missed messages, once per day" on={email.digest} onToggle={() => setEmail(e => ({ ...e, digest: !e.digest }))} />
        <ToggleRow label="Weekly highlights" desc="Top activity from your workspace each week" on={email.weekly} onToggle={() => setEmail(e => ({ ...e, weekly: !e.weekly }))} />
      </Sect>

      <Sect title="Keywords" desc="Get notified any time these words appear in any channel">
        <div className="flex gap-2 mb-3">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKeyword()}
            placeholder="Add a keyword…"
            className="flex-1 h-9 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition"
          />
          <Button variant="secondary" size="sm" onClick={addKeyword}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map(k => (
            <span key={k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-elevated border border-line text-[13px] text-ink">
              {k}
              <button onClick={() => setKeywords(kws => kws.filter(x => x !== k))} className="text-muted hover:text-ink transition"><Icon name="x" size={12} /></button>
            </span>
          ))}
        </div>
      </Sect>
    </div>
  );
}

// ─────────────────────────────────────────
// Appearance
// ─────────────────────────────────────────

function AppearanceTab() {
  const { density, fontSize, setDensity, setFontSize } = useAppearance();
  const [linkPreview, setLinkPreview] = useState(true);
  const [animations, setAnimations] = useState(true);

  const densities = [
    {
      id: 'comfortable' as const, label: 'Comfortable', desc: 'More space between messages',
      preview: (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded bg-elevated shrink-0" />
              <div className="space-y-1.5 pt-0.5">
                <div className="h-2 w-14 rounded bg-elevated" />
                <div className="h-2 w-24 rounded bg-divider" />
                <div className="h-2 w-20 rounded bg-divider" />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'compact' as const, label: 'Compact', desc: 'Tighter spacing, see more messages',
      preview: (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-1.5">
              <div className="w-4 h-4 rounded bg-elevated shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="h-1.5 w-12 rounded bg-elevated" />
                <div className="h-1.5 w-20 rounded bg-divider" />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'cozy' as const, label: 'Cozy', desc: 'Condensed, no avatars shown',
      preview: (
        <div className="space-y-1.5">
          {['9:02 · Sarah', '9:14 · Marcus', '9:21 · Priya', '9:38 · Devon'].map(n => (
            <div key={n} className="flex gap-2 items-center">
              <div className="h-1.5 w-10 rounded bg-muted shrink-0" />
              <div className="h-1.5 w-20 rounded bg-divider" />
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Appearance</h2>
      <p className="text-[13px] text-sub mb-0">Customize how Teamflow looks for you.</p>

      <Sect title="Theme">
        <div className="flex items-center justify-between p-4 rounded-lg bg-panel border border-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-black border border-line flex items-center justify-center text-white font-bold">◐</div>
            <div>
              <div className="text-[14px] font-medium text-ink">Dark</div>
              <div className="text-[12px] text-sub">Currently active theme</div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-sub border border-line px-2.5 py-0.5 rounded-full">Active</span>
        </div>
      </Sect>

      <Sect title="Message density" desc="How much breathing room between messages in the feed">
        <div className="grid grid-cols-3 gap-3">
          {densities.map(d => (
            <button
              key={d.id}
              onClick={() => setDensity(d.id)}
              className={`rounded-lg border p-4 text-left transition-all ${
                density === d.id ? 'border-white bg-elevated' : 'border-line hover:border-[#555555]'
              }`}
            >
              <div className="mb-3 h-16 overflow-hidden">{d.preview}</div>
              <div className="text-[13px] font-medium text-ink">{d.label}</div>
              <div className="text-[11px] text-muted mt-0.5 leading-snug">{d.desc}</div>
            </button>
          ))}
        </div>
      </Sect>

      <Sect title="Font size">
        <div className="flex gap-3">
          {([['small','Small','13px'], ['default','Default','15px'], ['large','Large','17px']] as const).map(([id, label, size]) => (
            <button
              key={id}
              onClick={() => setFontSize(id)}
              className={`flex-1 rounded-lg border p-4 text-center transition ${
                fontSize === id ? 'border-white bg-elevated' : 'border-line hover:border-[#555555]'
              }`}
            >
              <div className="text-ink mb-1.5" style={{ fontSize }}>Aa</div>
              <div className="text-[12px] text-sub">{label}</div>
            </button>
          ))}
        </div>
      </Sect>

      <Sect title="Other">
        <ToggleRow label="Link previews" desc="Show inline previews for URLs pasted in messages" on={linkPreview} onToggle={() => setLinkPreview(v => !v)} />
        <ToggleRow label="Animations" desc="Motion effects and transitions throughout the app" on={animations} onToggle={() => setAnimations(v => !v)} />
      </Sect>
    </div>
  );
}

// ─────────────────────────────────────────
// General
// ─────────────────────────────────────────

function GeneralTab() {
  const [wsName, setWsName] = useState('Nomor');
  const [saved, setSaved] = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">General</h2>
      <p className="text-[13px] text-sub mb-0">Workspace-wide settings.</p>

      <Sect title="Workspace identity">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl select-none shrink-0" style={{ letterSpacing: '-0.02em' }}>
              N
            </div>
            <div>
              <Button variant="secondary" size="sm">Change icon</Button>
              <p className="text-[12px] text-muted mt-1.5">SVG or PNG · 256 × 256 recommended</p>
            </div>
          </div>
          <FieldInput label="Workspace name" value={wsName} onChange={e => setWsName(e.target.value)} />
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Workspace URL</label>
            <div className="flex items-center h-10 rounded-md bg-elevated border border-divider overflow-hidden">
              <span className="pl-3 text-[14px] text-muted">teamflow.io/</span>
              <span className="text-[14px] text-sub pr-3">nomor</span>
            </div>
          </div>
        </div>
      </Sect>

      <Sect title="Region & language">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Language</label>
            <select className="w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink outline-none focus:border-[#555555] transition cursor-pointer appearance-none">
              <option>English (US)</option>
              <option>English (UK)</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Timezone</label>
            <select className="w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink outline-none focus:border-[#555555] transition cursor-pointer appearance-none">
              <option>NPT (UTC+5:45)</option>
              <option>PST (UTC−8)</option>
              <option>EST (UTC−5)</option>
              <option>GMT (UTC+0)</option>
              <option>IST (UTC+5:30)</option>
            </select>
          </div>
        </div>
      </Sect>

      <div className="pt-2 pb-10 flex items-center gap-3">
        <Button onClick={save}>
          {saved ? <><Icon name="check" size={15} /> Saved!</> : 'Save changes'}
        </Button>
        {saved && <span className="text-[13px] text-sub anim-fade">Changes saved.</span>}
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-danger/40 p-6 space-y-4" style={{ background: 'rgba(239,68,68,0.04)' }}>
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Danger zone</h3>
          <p className="text-[13px] text-sub mt-0.5">Irreversible actions. Think twice.</p>
        </div>
        <div className="space-y-0 divide-y divide-danger/20">
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="text-[14px] text-ink">Leave workspace</div>
              <div className="text-[12px] text-sub mt-0.5">You will lose access to all channels and messages</div>
            </div>
            <Button variant="secondary" size="sm">Leave</Button>
          </div>
          <div className="flex items-center justify-between pt-4">
            <div>
              <div className="text-[14px] text-danger">Delete workspace</div>
              <div className="text-[12px] text-sub mt-0.5">Permanently deletes Nomor and all its data</div>
            </div>
            <Button variant="danger" size="sm">Delete workspace</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Members
// ─────────────────────────────────────────

function MembersTab() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filtered = MEMBERS.filter(m => {
    const u = USERS[m.userId];
    const matchQ    = u.name.toLowerCase().includes(query.toLowerCase());
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchQ && matchRole;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tightest text-ink">Members</h2>
          <p className="text-[13px] text-sub mt-0.5">{MEMBERS.length} people in Nomor</p>
        </div>
        <Button><Icon name="plus" size={15} /> Invite people</Button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter members…"
            className="w-full h-9 pl-9 pr-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] transition"
          />
        </div>
        <div className="flex items-center gap-1">
          {['All', 'Owner', 'Admin', 'Member'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`h-8 px-3 rounded-md text-[13px] font-medium transition ${
                roleFilter === r ? 'bg-elevated text-ink' : 'text-sub hover:bg-elevated hover:text-ink'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 h-10 items-center bg-panel border-b border-divider text-[11px] uppercase tracking-wider text-muted">
          <span>Member</span>
          <span className="w-24">Role</span>
          <span className="w-24 text-right">Joined</span>
          <span className="w-8" />
        </div>
        {filtered.map((m, i) => {
          const u = USERS[m.userId];
          return (
            <div
              key={m.userId}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 h-[62px] items-center hover:bg-panel transition ${
                i < filtered.length - 1 ? 'border-b border-divider' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar userId={m.userId} size={34} presence />
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-ink truncate flex items-center gap-1.5">
                    {u.name}
                    {m.userId === CURRENT_USER.id && <span className="text-muted font-normal text-[12px]">(you)</span>}
                  </div>
                  <div className="text-[12px] text-sub truncate">{u.name.toLowerCase().replace(' ', '.')}@acme.co</div>
                </div>
              </div>
              <div className="w-24"><RoleBadge role={m.role} /></div>
              <div className="w-24 text-right text-[13px] text-sub">{m.joined}</div>
              <div className="w-8 flex justify-end">
                {m.userId !== CURRENT_USER.id && (
                  <button className="text-muted hover:text-ink transition p-1 rounded-md hover:bg-elevated">
                    <Icon name="more" size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-[15px] font-semibold text-ink mb-3">Pending invitations</h3>
        <div className="rounded-lg border border-dashed border-line py-12 flex flex-col items-center justify-center text-muted">
          <Icon name="users" size={24} />
          <p className="text-[13px] mt-3">No pending invitations</p>
          <p className="text-[12px] mt-1">Invite people with the button above</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Billing
// ─────────────────────────────────────────

function BillingTab() {
  const plans = [
    { name: 'Free',       price: '$0',     label: 'per seat/mo', current: false, features: ['Up to 5 members', '10k message history', '5 GB storage'] },
    { name: 'Pro',        price: '$7',     label: 'per seat/mo', current: true,  features: ['Unlimited members', '∞ message history', '50 GB storage'] },
    { name: 'Enterprise', price: 'Custom', label: 'contact sales', current: false, features: ['SSO & SAML', 'Audit logs & SLA', 'Dedicated CSM'] },
  ];
  const usage = [
    { label: 'Members',         val: '5 of unlimited',       pct: 18, sub: '5 active members' },
    { label: 'File storage',    val: '18.4 GB of 50 GB',     pct: 37, sub: '31.6 GB remaining' },
    { label: 'API calls',       val: '4,210 of 100k / mo',   pct: 4,  sub: 'Resets Jul 1' },
    { label: 'Message history', val: '∞ messages',           pct: 0,  sub: 'Unlimited on Pro' },
  ];
  const invoices = [
    { date: 'Jun 1, 2026', amount: '$35.00', status: 'Paid' },
    { date: 'May 1, 2026', amount: '$35.00', status: 'Paid' },
    { date: 'Apr 1, 2026', amount: '$35.00', status: 'Paid' },
    { date: 'Mar 1, 2026', amount: '$28.00', status: 'Paid' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[20px] font-semibold tracking-tightest text-ink">Billing</h2>
        <p className="text-[13px] text-sub mt-0.5">Manage your plan, usage and payment method.</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-3">
        {plans.map(plan => (
          <div key={plan.name} className={`rounded-lg border p-5 flex flex-col gap-3 transition ${plan.current ? 'border-white bg-panel' : 'border-line'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-ink">{plan.name}</span>
              {plan.current && <span className="text-[11px] border border-white text-ink px-2 py-0.5 rounded-full">Current</span>}
            </div>
            <div>
              <span className="text-[22px] font-bold tracking-tightest text-ink">{plan.price}</span>
              <span className="text-[12px] text-sub ml-1">{plan.label}</span>
            </div>
            <ul className="space-y-1.5 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-[13px] text-sub">
                  <Icon name="check" size={12} className="text-ink shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {!plan.current && (
              <Button variant={plan.name === 'Enterprise' ? 'secondary' : 'primary'} size="sm">
                {plan.name === 'Enterprise' ? 'Contact sales' : 'Upgrade'}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Usage */}
      <div>
        <h3 className="text-[15px] font-semibold text-ink mb-3">Usage</h3>
        <div className="grid grid-cols-2 gap-3">
          {usage.map(s => (
            <div key={s.label} className="rounded-lg border border-line bg-panel p-4">
              <div className="text-[13px] text-sub">{s.label}</div>
              <div className="text-[17px] font-semibold text-ink mt-0.5 tracking-tightest">{s.val}</div>
              {s.pct > 0 && (
                <div className="h-1.5 rounded-full bg-elevated mt-2.5 overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${s.pct}%` }} />
                </div>
              )}
              <div className="text-[11px] text-muted mt-1.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div>
        <h3 className="text-[15px] font-semibold text-ink mb-3">Payment method</h3>
        <div className="rounded-lg border border-line bg-panel p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 rounded-md bg-elevated border border-divider flex items-center justify-center">
              <Icon name="card" size={16} className="text-ink" />
            </div>
            <div>
              <div className="text-[14px] text-ink">Visa ending in 4242</div>
              <div className="text-[12px] text-sub">Expires 09 / 2027</div>
            </div>
          </div>
          <Button variant="secondary" size="sm">Update</Button>
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h3 className="text-[15px] font-semibold text-ink mb-3">Invoice history</h3>
        <div className="rounded-lg border border-line overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] px-4 h-9 items-center bg-panel border-b border-divider text-[11px] uppercase tracking-wider text-muted gap-4">
            <span>Date</span><span>Amount</span><span className="w-16 text-center">Status</span><span className="w-12 text-right">PDF</span>
          </div>
          {invoices.map((inv, i) => (
            <div key={inv.date} className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 h-12 items-center hover:bg-panel transition ${i < invoices.length - 1 ? 'border-b border-divider' : ''}`}>
              <span className="text-[14px] text-ink">{inv.date}</span>
              <span className="text-[14px] text-ink">{inv.amount}</span>
              <span className="w-16 text-center">
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{inv.status}</span>
              </span>
              <span className="w-12 text-right">
                <button className="text-[13px] text-sub hover:text-ink transition">↓</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Integrations
// ─────────────────────────────────────────

const INTEGRATIONS = [
  { id: 'github',  name: 'GitHub',       desc: 'Link PRs and issues directly in messages',       bg: '#24292e', letter: 'G', fgDark: false, defaultOn: true,  account: 'subhash-adhikari' },
  { id: 'figma',   name: 'Figma',        desc: 'Unfurl Figma links with live frame previews',    bg: '#f24e1e', letter: 'F', fgDark: false, defaultOn: true,  account: 'Subhash' },
  { id: 'linear',  name: 'Linear',       desc: 'Show issue status without leaving Teamflow',      bg: '#5e6ad2', letter: 'L', fgDark: false, defaultOn: false, account: '' },
  { id: 'notion',  name: 'Notion',       desc: 'Preview Notion pages inline in chat',            bg: '#f5f5f5', letter: 'N', fgDark: true,  defaultOn: false, account: '' },
  { id: 'zapier',  name: 'Zapier',       desc: 'Automate workflows between your tools',           bg: '#ff4a00', letter: 'Z', fgDark: false, defaultOn: false, account: '' },
  { id: 'gdrive',  name: 'Google Drive', desc: 'Attach and preview Drive files in messages',     bg: '#4285f4', letter: 'D', fgDark: false, defaultOn: false, account: '' },
];

function IntegrationsTab() {
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATIONS.map(i => [i.id, i.defaultOn]))
  );

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Integrations</h2>
      <p className="text-[13px] text-sub mb-6">Connect Teamflow to your other tools.</p>

      <div className="space-y-2">
        {INTEGRATIONS.map(intg => (
          <div key={intg.id} className="flex items-center gap-4 rounded-lg border border-line bg-panel p-4 hover:border-[#444] transition">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[15px] shrink-0 select-none border border-white/10"
              style={{ background: intg.bg, color: intg.fgDark ? '#111' : '#fff' }}
            >
              {intg.letter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-medium text-ink">{intg.name}</span>
                {connected[intg.id] && (
                  <span className="text-[11px] px-1.5 py-px rounded-full border" style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)' }}>
                    Connected
                  </span>
                )}
              </div>
              <div className="text-[13px] text-sub mt-0.5 truncate">{intg.desc}</div>
              {connected[intg.id] && intg.account && (
                <div className="text-[12px] text-muted mt-0.5">as <span className="text-sub">{intg.account}</span></div>
              )}
            </div>
            <Button
              variant={connected[intg.id] ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setConnected(c => ({ ...c, [intg.id]: !c[intg.id] }))}
            >
              {connected[intg.id] ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-line p-5 text-center">
        <p className="text-[13px] text-sub">
          Building something? Use the{' '}
          <span className="text-ink cursor-pointer hover:underline">REST API</span>
          {' '}or{' '}
          <span className="text-ink cursor-pointer hover:underline">webhooks</span>
          {' '}to connect any tool.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────

function PermissionsTab() {
  const [invite, setInvite]     = useState<'All' | 'Admins'>('All');
  const [channel, setChannel]   = useState<'All' | 'Admins'>('Admins');
  const [announce, setAnnounce] = useState<'All' | 'Admins'>('Admins');
  const [delMsg, setDelMsg]     = useState<'All' | 'Admins'>('Admins');
  const [guests, setGuests]     = useState(false);
  const [exportData, setExport] = useState(false);

  function RadioPair({ label, desc, value, onChange }: { label: string; desc: string; value: 'All' | 'Admins'; onChange: (v: 'All' | 'Admins') => void }) {
    return (
      <div className="flex items-center justify-between gap-4 py-4 border-b border-divider last:border-0">
        <div className="min-w-0">
          <div className="text-[14px] text-ink">{label}</div>
          <div className="text-[12px] text-sub mt-0.5">{desc}</div>
        </div>
        <div className="flex items-center rounded-md border border-line bg-elevated overflow-hidden shrink-0 text-[13px]">
          {(['All', 'Admins'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 transition ${value === opt ? 'bg-white text-black font-medium' : 'text-sub hover:text-ink'}`}
            >
              {opt === 'All' ? 'All members' : 'Admins only'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Permissions</h2>
      <p className="text-[13px] text-sub mb-0">Control who can do what in your workspace.</p>

      <Sect title="Member permissions">
        <RadioPair label="Invite members"              desc="Who can send invitations to new people"               value={invite}   onChange={setInvite} />
        <RadioPair label="Create channels"             desc="Who can create new channels"                          value={channel}  onChange={setChannel} />
        <RadioPair label="Post in #announcements"      desc="Who can send messages in the announcements channel"   value={announce} onChange={setAnnounce} />
        <RadioPair label="Delete others' messages"     desc="Who can remove messages from other members"           value={delMsg}   onChange={setDelMsg} />
      </Sect>

      <Sect title="Access control">
        <ToggleRow label="Guest access"       desc="Allow guests with scoped channel access to join the workspace" on={guests}     onToggle={() => setGuests(v => !v)} />
        <ToggleRow label="Data export"        desc="Allow admins to export messages and files"                     on={exportData} onToggle={() => setExport(v => !v)} />
      </Sect>
    </div>
  );
}

// ─────────────────────────────────────────
// Root
// ─────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: 'WORKSPACE',
    items: [
      { id: 'General',      icon: 'settings' },
      { id: 'Members',      icon: 'users'    },
      { id: 'Billing',      icon: 'card'     },
      { id: 'Integrations', icon: 'zap'      },
      { id: 'Permissions',  icon: 'shield'   },
    ],
  },
  {
    label: 'YOUR ACCOUNT',
    items: [
      { id: 'Profile',       icon: 'at'      },
      { id: 'Security',      icon: 'shield'  },
      { id: 'Notifications', icon: 'bell'    },
      { id: 'Appearance',    icon: 'sliders' },
    ],
  },
];

interface Props {
  onClose: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function SettingsOverlay({ onClose, initialTab = 'Profile', onTabChange }: Props) {
  const [tab, setTab] = useState(initialTab);

  function handleTabChange(t: string) {
    setTab(t);
    onTabChange?.(t);
  }

  function renderTab() {
    switch (tab) {
      case 'Profile':       return <ProfileTab />;
      case 'Security':      return <SecurityTab />;
      case 'Notifications': return <NotificationsTab />;
      case 'Appearance':    return <AppearanceTab />;
      case 'General':       return <GeneralTab />;
      case 'Members':       return <MembersTab />;
      case 'Billing':       return <BillingTab />;
      case 'Integrations':  return <IntegrationsTab />;
      case 'Permissions':   return <PermissionsTab />;
      default:              return null;
    }
  }

  return (
    <div className="fixed inset-0 z-[105] bg-bg anim-fade flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-divider flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-muted">/</span>
          <span className="text-[14px] font-medium text-ink">Settings</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 h-9 px-3 rounded-md border border-line text-sub hover:text-ink hover:border-[#555555] transition text-[13px]"
        >
          <Icon name="x" size={15} /> Close
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar nav */}
        <nav className="w-[220px] border-r border-divider p-3 shrink-0 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-5">
              <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted">{group.label}</div>
              {group.items.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleTabChange(n.id)}
                  className={`w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[14px] transition ${
                    tab === n.id ? 'bg-elevated text-ink' : 'text-sub hover:bg-elevated hover:text-ink'
                  }`}
                >
                  <Icon name={n.icon} size={16} /> {n.id}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-8 py-8">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
