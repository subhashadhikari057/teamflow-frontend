'use client';

import { useState } from 'react';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import Button from '@/components/primitives/Button';
import { RoleBadge } from './_shared';
import { MEMBERS, USERS, CURRENT_USER } from '@/lib/data';

export default function MembersTab() {
  const [query,      setQuery]      = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filtered = MEMBERS.filter(m => {
    const u = USERS[m.userId];
    return u.name.toLowerCase().includes(query.toLowerCase()) && (roleFilter === 'All' || m.role === roleFilter);
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
              className={`h-8 px-3 rounded-md text-[13px] font-medium transition ${roleFilter === r ? 'bg-elevated text-ink' : 'text-sub hover:bg-elevated hover:text-ink'}`}
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
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 h-[62px] items-center hover:bg-panel transition ${i < filtered.length - 1 ? 'border-b border-divider' : ''}`}
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
