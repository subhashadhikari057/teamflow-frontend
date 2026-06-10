'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/primitives/Icon';

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    items: [
      { label: 'Open search / command palette', keys: ['Ctrl', 'K'] },
      { label: 'New message / compose',         keys: ['Ctrl', 'T'] },
      { label: 'Move between channels',         keys: ['Alt', '↑', '↓'] },
      { label: 'Open direct messages',          keys: ['Ctrl', 'Shift', 'K'] },
      { label: 'Open all channels list',        keys: ['Ctrl', 'Shift', 'L'] },
      { label: 'Navigate back / forward',       keys: ['Ctrl', '[', ']'] },
      { label: 'Jump to workspace 1–9',         keys: ['Ctrl', '1–9'] },
    ],
  },
  {
    title: 'Messaging',
    items: [
      { label: 'Send message',        keys: ['Enter'] },
      { label: 'New line in message', keys: ['Shift', 'Enter'] },
      { label: 'Edit last message',   keys: ['↑'] },
      { label: 'Bold text',           keys: ['Ctrl', 'B'] },
      { label: 'Italic text',         keys: ['Ctrl', 'I'] },
      { label: 'Strikethrough',       keys: ['Ctrl', 'Shift', 'X'] },
      { label: 'Inline code',         keys: ['Ctrl', 'Shift', 'C'] },
      { label: 'Cancel / close thread', keys: ['Esc'] },
    ],
  },
  {
    title: 'Files & Actions',
    items: [
      { label: 'Upload file',         keys: ['Ctrl', 'U'] },
      { label: 'Set your status',     keys: ['Ctrl', 'Shift', 'Y'] },
      { label: 'Open activity feed',  keys: ['Ctrl', 'Shift', 'H'] },
      { label: 'Open saved items',    keys: ['Ctrl', 'Shift', 'S'] },
      { label: 'Open all unreads',    keys: ['Ctrl', 'Shift', 'A'] },
    ],
  },
  {
    title: 'Calls',
    items: [
      { label: 'Toggle mute (in call)',         keys: ['M'] },
      { label: 'Toggle camera (in call)',       keys: ['V'] },
      { label: 'Toggle screen share (in call)', keys: ['S'] },
      { label: 'End call',                      keys: ['E'] },
    ],
  },
];

export default function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const ql = q.toLowerCase();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const totalMatches = SHORTCUT_GROUPS.reduce(
    (n, g) => n + g.items.filter((it) => it.label.toLowerCase().includes(ql)).length,
    0,
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center items-start pt-[12vh] anim-fade"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[820px] rounded-lg border border-line bg-panel overflow-hidden anim-scale shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-divider">
          <h2 className="text-[16px] font-semibold tracking-tightest text-ink">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sub hover:text-ink transition"
          >
            <span className="kbd">ESC</span>
            <span className="w-8 h-8 rounded-md hover:bg-elevated flex items-center justify-center">
              <Icon name="x" size={17} />
            </span>
          </button>
        </div>

        <div className="px-5 py-3 border-b border-divider">
          <div className="flex items-center gap-2.5 h-9 px-3 rounded-md bg-bg border border-line focus-within:border-[#555555] transition">
            <Icon name="search" size={15} className="text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter shortcuts…"
              className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-muted outline-none"
            />
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {totalMatches === 0 ? (
            <div className="py-12 text-center text-[14px] text-muted">No shortcuts match "{q}"</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
              {SHORTCUT_GROUPS.map((g) => {
                const anyMatch = g.items.some((it) => it.label.toLowerCase().includes(ql));
                if (q && !anyMatch) return null;
                return (
                  <div key={g.title}>
                    <div className="flex items-center gap-3 mb-2 px-3">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-muted font-medium">
                        {g.title}
                      </span>
                      <div className="h-px bg-divider flex-1" />
                    </div>
                    <div>
                      {g.items.map((it) => {
                        const match = !q || it.label.toLowerCase().includes(ql);
                        return (
                          <div
                            key={it.label}
                            className="flex items-center justify-between gap-4 px-3 h-9 rounded-md hover:bg-elevated transition"
                          >
                            <span className={`text-[13.5px] ${match ? 'text-ink' : 'text-[#333333]'}`}>
                              {it.label}
                            </span>
                            <span className={`flex items-center gap-1 shrink-0 ${match ? '' : 'opacity-30'}`}>
                              {it.keys.map((k, i) => <span key={i} className="kbd">{k}</span>)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
