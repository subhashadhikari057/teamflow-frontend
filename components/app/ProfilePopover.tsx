'use client';

import { useEffect } from 'react';
import Icon from '@/components/primitives/Icon';
import Button from '@/components/primitives/Button';
import { USERS } from '@/lib/data';

interface ProfilePopoverProps {
  userId: string;
  onClose: () => void;
  onMessage: (id: string) => void;
  onSetStatus: () => void;
}

export default function ProfilePopover({ userId, onClose, onMessage, onSetStatus }: ProfilePopoverProps) {
  const u = USERS[userId];
  const isMe = userId === 'ashim';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!u) return null;

  const presenceDot = u.presence === 'online' ? '#22c55e' : u.presence === 'away' ? '#eab308' : '#555';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center anim-fade"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-[320px] rounded-lg border border-line bg-panel overflow-hidden anim-scale shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="h-20 bg-gradient-to-br from-elevated to-panel border-b border-divider" />
        <div className="px-5 pb-5 -mt-9">
          <div
            className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-[30px] font-bold text-white border-4 border-panel"
            style={{ background: u.color }}
          >
            {u.initials}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h3 className="text-[18px] font-semibold tracking-tightest text-ink">{u.name}</h3>
            <span className="w-2 h-2 rounded-full" style={{ background: presenceDot }} />
          </div>
          <div className="text-[13px] text-sub">{u.role}</div>
          {u.status && (
            <div className="mt-3 text-[13px] text-ink flex items-center gap-2 bg-elevated border border-divider rounded-md px-2.5 py-1.5">
              {u.status}
            </div>
          )}
          {isMe && (
            <button
              onClick={() => {
                onClose();
                onSetStatus();
              }}
              className="mt-3 w-full flex items-center gap-2 text-[13px] text-sub hover:text-ink bg-elevated border border-line rounded-md px-3 h-9 transition"
            >
              <span className="w-2 h-2 rounded-full bg-online" /> Set a status…
            </button>
          )}
          <div className="mt-4 flex gap-2">
            {!isMe && (
              <Button className="flex-1" onClick={() => onMessage(userId)}>Message</Button>
            )}
            <Button variant="secondary" className={isMe ? 'w-full' : 'flex-1'}>
              View profile
            </Button>
          </div>
          <div className="mt-4 pt-4 border-t border-divider text-[12px] text-muted flex items-center gap-2">
            <Icon name="globe" size={13} /> {u.tz} · Local time 10:24 AM
          </div>
        </div>
      </div>
    </div>
  );
}
