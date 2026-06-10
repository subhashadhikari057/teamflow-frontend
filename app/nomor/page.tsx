'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/app/Sidebar';
import ChannelView from '@/components/app/ChannelView';
import ThreadPanel from '@/components/app/ThreadPanel';
import SearchOverlay from '@/components/app/SearchOverlay';
import ShortcutsOverlay from '@/components/app/ShortcutsOverlay';
import ProfilePopover from '@/components/app/ProfilePopover';
import CallOverlay from '@/components/app/CallOverlay';
import Toast from '@/components/app/Toast';
import { CHANNELS } from '@/lib/data';

interface ActiveView {
  type: 'channel' | 'dm';
  id: string;
}

interface Overlays {
  search: boolean;
  shortcuts: boolean;
}

interface CallState {
  open: boolean;
  muted: boolean;
  camOff: boolean;
  sharing: boolean;
}

export default function WorkspacePage() {
  const [active, setActive] = useState<ActiveView>({ type: 'channel', id: 'engineering' });
  const [threadId, setThreadId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [ov, setOv] = useState<Overlays>({ search: false, shortcuts: false });
  const [profileUser, setProfileUser] = useState<string | null>(null);
  const [call, setCall] = useState<CallState>({ open: false, muted: false, camOff: false, sharing: false });
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  }, []);

  // Auto-collapse on small screens
  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selectChannel = useCallback((id: string) => {
    setActive({ type: 'channel', id }); setThreadId(null);
  }, []);
  const selectDm = useCallback((id: string) => {
    setActive({ type: 'dm', id }); setThreadId(null);
  }, []);
  const onSelect = useCallback((a: ActiveView) => {
    setActive(a); setThreadId(null);
  }, []);

  const cycleChannel = useCallback((dir: number) => {
    setActive((cur) => {
      const ids = CHANNELS.map((c) => c.id);
      let idx = cur.type === 'channel' ? ids.indexOf(cur.id) : 0;
      idx = (idx + dir + ids.length) % ids.length;
      return { type: 'channel', id: ids[idx] };
    });
    setThreadId(null);
  }, []);

  const jumpChannel = useCallback((i: number) => {
    if (i >= 0 && i < CHANNELS.length) { selectChannel(CHANNELS[i].id); }
  }, [selectChannel]);

  const openCompose = useCallback(() => {
    selectDm('sarah'); flashToast('New message');
  }, [selectDm, flashToast]);

  // Global keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
      const k = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const modalOpen = ov.search || ov.shortcuts || call.open;

      // Toggle shortcuts: "?" or Ctrl+/
      if ((k === '?' && !typing) || (ctrl && k === '/')) {
        e.preventDefault();
        setOv((o) => ({ search: false, shortcuts: !o.shortcuts }));
        return;
      }

      if (call.open && !typing) {
        const lk = k.toLowerCase();
        if (lk === 'm') { e.preventDefault(); setCall((c) => ({ ...c, muted: !c.muted })); return; }
        if (lk === 'v') { e.preventDefault(); setCall((c) => ({ ...c, camOff: !c.camOff })); return; }
        if (lk === 's') { e.preventDefault(); setCall((c) => ({ ...c, sharing: !c.sharing })); return; }
        if (lk === 'e') { e.preventDefault(); setCall((c) => ({ ...c, open: false })); flashToast('Call ended'); return; }
      }

      if (ctrl && e.shiftKey) {
        const key = k.toLowerCase();
        const map: Record<string, () => void> = {
          k: () => { selectDm('sarah'); flashToast('Direct messages'); },
          l: () => { selectChannel('general'); flashToast('All channels'); },
          x: () => flashToast('Strikethrough'),
          c: () => flashToast('Inline code'),
          y: () => setProfileUser('ashim'),
          h: () => flashToast('Activity feed'),
          s: () => flashToast('Saved items'),
          a: () => flashToast('All unreads'),
        };
        if (map[key]) { e.preventDefault(); if (!ov.shortcuts) map[key](); return; }
      }

      if (ctrl && !e.shiftKey) {
        const key = k.toLowerCase();
        if (key === 'k') { e.preventDefault(); setOv((o) => ({ ...o, search: !o.search, shortcuts: false })); return; }
        if (key === 't') { e.preventDefault(); if (!modalOpen) openCompose(); return; }
        if (key === 'u') { e.preventDefault(); if (!modalOpen) flashToast('Upload file'); return; }
        if (key === '[') { e.preventDefault(); if (!modalOpen) cycleChannel(-1); return; }
        if (key === ']') { e.preventDefault(); if (!modalOpen) cycleChannel(1); return; }
        if (/^[1-9]$/.test(k)) { e.preventDefault(); if (!modalOpen) jumpChannel(Number(k) - 1); return; }
      }

      if (e.altKey && (k === 'ArrowUp' || k === 'ArrowDown')) {
        e.preventDefault();
        if (!modalOpen) cycleChannel(k === 'ArrowUp' ? -1 : 1);
        return;
      }

      if (k === 'Escape' && !typing && !modalOpen && threadId) {
        setThreadId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ov, call, threadId, cycleChannel, jumpChannel, flashToast, openCompose, selectChannel, selectDm]);

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        active={active}
        onSelect={onSelect}
        openSearch={() => setOv((o) => ({ ...o, search: true }))}
        openSettings={() => flashToast('Settings')}
        openShortcuts={() => setOv((o) => ({ ...o, shortcuts: true }))}
        openProfile={setProfileUser}
        openCompose={openCompose}
      />

      <ChannelView
        active={active}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        openSearch={() => setOv((o) => ({ ...o, search: true }))}
        openCall={() => setCall((c) => ({ ...c, open: true }))}
        openThread={setThreadId}
        openProfile={setProfileUser}
      />

      {threadId && (
        <ThreadPanel
          messageId={threadId}
          onClose={() => setThreadId(null)}
          onOpenProfile={setProfileUser}
        />
      )}

      {ov.search && (
        <SearchOverlay
          onClose={() => setOv((o) => ({ ...o, search: false }))}
          onSelectChannel={selectChannel}
          onSelectDm={selectDm}
        />
      )}
      {ov.shortcuts && (
        <ShortcutsOverlay onClose={() => setOv((o) => ({ ...o, shortcuts: false }))} />
      )}
      {call.open && (
        <CallOverlay
          state={call}
          setState={setCall}
          onEnd={() => { setCall((c) => ({ ...c, open: false })); flashToast('Call ended'); }}
        />
      )}
      {profileUser && (
        <ProfilePopover
          userId={profileUser}
          onClose={() => setProfileUser(null)}
          onMessage={(id) => { setProfileUser(null); selectDm(id); }}
        />
      )}

      <Toast msg={toast} />
    </div>
  );
}
