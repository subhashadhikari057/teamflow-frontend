'use client';

import { useState } from 'react';
import { Sect, ToggleRow } from './_shared';

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

export default function PermissionsTab() {
  const [invite,   setInvite]   = useState<'All' | 'Admins'>('All');
  const [channel,  setChannel]  = useState<'All' | 'Admins'>('Admins');
  const [announce, setAnnounce] = useState<'All' | 'Admins'>('Admins');
  const [delMsg,   setDelMsg]   = useState<'All' | 'Admins'>('Admins');
  const [guests,   setGuests]   = useState(false);
  const [exportData, setExport] = useState(false);

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Permissions</h2>
      <p className="text-[13px] text-sub mb-0">Control who can do what in your workspace.</p>

      <Sect title="Member permissions">
        <RadioPair label="Invite members"          desc="Who can send invitations to new people"             value={invite}   onChange={setInvite} />
        <RadioPair label="Create channels"         desc="Who can create new channels"                        value={channel}  onChange={setChannel} />
        <RadioPair label="Post in #announcements"  desc="Who can send messages in the announcements channel" value={announce} onChange={setAnnounce} />
        <RadioPair label="Delete others' messages" desc="Who can remove messages from other members"         value={delMsg}   onChange={setDelMsg} />
      </Sect>

      <Sect title="Access control">
        <ToggleRow label="Guest access" desc="Allow guests with scoped channel access to join the workspace" on={guests}     onToggle={() => setGuests(v => !v)} />
        <ToggleRow label="Data export"  desc="Allow admins to export messages and files"                     on={exportData} onToggle={() => setExport(v => !v)} />
      </Sect>
    </div>
  );
}
