'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import Icon from '@/components/primitives/Icon';
import Button from '@/components/primitives/Button';
import { useCurrentUser, useMe, useUpdateProfile } from '@/hooks/auth';
import { uploadImage, getUploadFileUrl } from '@/lib/api/uploads';
import { useToast } from '@/lib/toast-context';
import type { UserStatus } from '@/lib/api/types';

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'ONLINE',         label: 'Online',         color: '#22c55e' },
  { value: 'AWAY',           label: 'Away',           color: '#eab308' },
  { value: 'BUSY',           label: 'Busy',           color: '#ef4444' },
  { value: 'DO_NOT_DISTURB', label: 'Do Not Disturb', color: '#ef4444' },
  { value: 'FOCUSING',       label: 'Focusing',       color: '#a855f7' },
  { value: 'IN_A_MEETING',   label: 'In a Meeting',   color: '#3b82f6' },
  { value: 'ON_VACATION',    label: 'On Vacation',    color: '#14b8a6' },
  { value: 'OUT_OF_OFFICE',  label: 'Out of Office',  color: '#f97316' },
  { value: 'OFFLINE',        label: 'Offline',        color: '#6b7280' },
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

const inputClass = 'w-full h-9 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition';
const selectClass = 'w-full h-9 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink outline-none focus:border-[#555555] transition cursor-pointer';

export default function ProfileTab() {
  const user          = useCurrentUser();
  const { isLoading } = useMe();
  const toast         = useToast();
  const updateProfile = useUpdateProfile();

  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [status,   setStatus]   = useState<UserStatus | ''>('');
  const [timezone, setTimezone] = useState('');
  const [uploadedAvatarPath, setUploadedAvatarPath] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetDraft() {
    setUploadedAvatarPath(null);
    setIsUploadingAvatar(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function startEditing() {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setStatus(user?.status ?? '');
    setTimezone(user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    resetDraft();
    setEditing(true);
  }

  function cancel() {
    resetDraft();
    setEditing(false);
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const uploaded = await uploadImage(file, true);
      setUploadedAvatarPath(uploaded.relativePath);
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image. Please try again.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function save() {
    try {
      await updateProfile.mutateAsync({
        name,
        phone,
        status: status || undefined,
        timezone,
        avatarUrl: uploadedAvatarPath ?? undefined,
      });
      resetDraft();
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile. Please try again.');
    }
  }

  const initials     = user?.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const statusOption = STATUS_OPTIONS.find(o => o.value === user?.status);
  const timezoneLabel = user?.timezone?.replace(/_/g, ' ') ?? '—';
  const avatarSrc = getUploadFileUrl(uploadedAvatarPath ?? user?.avatarUrl);
  const disableSave = updateProfile.isPending || isUploadingAvatar;

  if (isLoading) return <div className="text-[14px] text-sub py-10 text-center">Loading…</div>;

  return (
    <div>
      {/* Avatar + identity header */}
      <div className="flex items-center gap-5 pb-7 border-b border-divider">
        <div className="relative shrink-0">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt={user?.name ?? 'Profile avatar'} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-elevated border border-line flex items-center justify-center text-ink font-semibold text-2xl select-none">
              {initials}
            </div>
          )}
          {editing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-panel border border-line flex items-center justify-center text-sub hover:text-ink disabled:text-muted disabled:cursor-not-allowed transition shadow-sm"
                aria-label="Upload profile photo"
                title="Upload profile photo"
              >
                <Icon name="compose" size={12} />
              </button>
            </>
          )}
          {editing && isUploadingAvatar && (
            <div className="absolute inset-0 rounded-2xl bg-black/45 flex items-center justify-center text-[11px] text-white font-medium">
              Uploading…
            </div>
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
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Display name</span>
          {editing ? <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" /> : <span className="text-[14px] text-ink">{user?.name ?? '—'}</span>}
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Email</span>
          <span className="text-[14px] text-ink">{user?.email ?? '—'}</span>
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Username</span>
          <span className="text-[14px] text-ink">@{user?.username ?? '—'}</span>
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Phone</span>
          {editing ? <input className={inputClass} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" /> : <span className="text-[14px] text-ink">{user?.phone || '—'}</span>}
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Status</span>
          {editing ? (
            <StatusSelect value={status} onChange={setStatus} />
          ) : (
            <span className="flex items-center gap-2 text-[14px] text-ink">
              {statusOption ? <><span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusOption.color }} />{statusOption.label}</> : '—'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Timezone</span>
          {editing ? (
            <select className={selectClass} value={timezone} onChange={e => setTimezone(e.target.value)}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
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
            <Button variant="secondary" onClick={cancel} disabled={disableSave}>Cancel</Button>
            <Button onClick={save} disabled={disableSave}>
              {isUploadingAvatar ? 'Uploading…' : updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={startEditing}>
            <Icon name="compose" size={13} /> Edit profile
          </Button>
        )}
      </div>
    </div>
  );
}
