'use client';

import { useState, useEffect } from 'react';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import { USERS, RECENT_SEARCHES, SEARCH_RESULTS } from '@/lib/data';

interface SearchOverlayProps {
  onClose: () => void;
  onSelectChannel: (id: string) => void;
  onSelectDm: (id: string) => void;
}

function SearchResult({
  group, it, onClose, onSelectChannel, onSelectDm,
}: {
  group: string;
  it: { id: string; userId?: string; text?: string; meta?: string; name?: string };
  onClose: () => void;
  onSelectChannel: (id: string) => void;
  onSelectDm: (id: string) => void;
}) {
  const act = () => {
    if (group === 'Channels') { onSelectChannel(it.name!); onClose(); }
    else if (group === 'People') { onSelectDm(it.userId!); onClose(); }
    else onClose();
  };

  let content: React.ReactNode;
  if (group === 'Messages') {
    const u = USERS[it.userId!];
    content = (
      <>
        <Avatar userId={it.userId!} size={28} presence={false} />
        <div className="min-w-0">
          <div className="text-[13.5px] text-ink truncate">
            <span className="font-semibold">{u.name}</span> {it.text}
          </div>
          <div className="text-[11px] text-muted">{it.meta}</div>
        </div>
      </>
    );
  } else if (group === 'Files') {
    content = (
      <>
        <div className="w-7 h-7 rounded-md bg-elevated border border-divider flex items-center justify-center text-sub">
          <Icon name="folder" size={14} />
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] text-ink truncate">{it.name}</div>
          <div className="text-[11px] text-muted">{it.meta}</div>
        </div>
      </>
    );
  } else if (group === 'Channels') {
    content = (
      <>
        <div className="w-7 h-7 rounded-md bg-elevated border border-divider flex items-center justify-center text-sub">
          <Icon name="hash" size={14} />
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] text-ink truncate">#{it.name}</div>
          <div className="text-[11px] text-muted">{it.meta}</div>
        </div>
      </>
    );
  } else {
    const u = USERS[it.userId!];
    content = (
      <>
        <Avatar userId={it.userId!} size={28} />
        <div className="min-w-0">
          <div className="text-[13.5px] text-ink truncate">{u.name}</div>
          <div className="text-[11px] text-muted">{u.role}</div>
        </div>
      </>
    );
  }

  return (
    <button
      onClick={act}
      className="w-full flex items-center gap-3 px-3 h-12 rounded-md text-left hover:bg-elevated transition"
    >
      {content}
    </button>
  );
}

export default function SearchOverlay({ onClose, onSelectChannel, onSelectDm }: SearchOverlayProps) {
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const groups = Object.entries(SEARCH_RESULTS);
  const filtered = groups
    .map(([g, items]) => {
      if (!q) return [g, items] as const;
      const ql = q.toLowerCase();
      const f = items.filter((it) =>
        JSON.stringify(it).toLowerCase().includes(ql) ||
        (it.userId && USERS[it.userId].name.toLowerCase().includes(ql)),
      );
      return [g, f] as const;
    })
    .filter(([, items]) => items.length > 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center items-start pt-[12vh] anim-fade"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[640px] rounded-lg border border-line bg-panel overflow-hidden anim-scale shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-divider">
          <Icon name="search" size={18} className="text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search messages, files, channels, people…"
            className="flex-1 bg-transparent text-[16px] text-ink placeholder:text-muted outline-none"
          />
          <button onClick={onClose} className="kbd">ESC</button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!q && (
            <div className="mb-1">
              <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted">Recent</div>
              {RECENT_SEARCHES.map((r) => (
                <button
                  key={r}
                  onClick={() => setQ(r)}
                  className="w-full flex items-center gap-3 px-3 h-10 rounded-md text-left text-sub hover:bg-elevated hover:text-ink transition"
                >
                  <Icon name="search" size={14} className="text-muted" />
                  <span className="text-[14px]">{r}</span>
                </button>
              ))}
            </div>
          )}
          {filtered.map(([g, items]) => (
            <div key={g} className="mb-1">
              <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted">{g}</div>
              {items.map((it) => (
                <SearchResult
                  key={it.id}
                  group={g}
                  it={it}
                  onClose={onClose}
                  onSelectChannel={onSelectChannel}
                  onSelectDm={onSelectDm}
                />
              ))}
            </div>
          ))}
          {q && filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-[14px] text-muted">No results for "{q}"</div>
          )}
        </div>

        <div className="h-10 border-t border-divider flex items-center gap-4 px-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="kbd">↵</span> open</span>
          <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span className="flex items-center gap-1.5"><span className="kbd">esc</span> close</span>
        </div>
      </div>
    </div>
  );
}
