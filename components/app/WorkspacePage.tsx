'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/app/Sidebar';
import ChannelView from '@/components/app/ChannelView';
import ThreadPanel from '@/components/app/ThreadPanel';
import SearchOverlay from '@/components/app/SearchOverlay';
import ShortcutsOverlay from '@/components/app/ShortcutsOverlay';
import ProfilePopover from '@/components/app/ProfilePopover';
import CallOverlay from '@/components/app/CallOverlay';
import ChannelInfoPanel from '@/components/app/ChannelInfoPanel';
import CreateChannelModal from '@/components/app/CreateChannelModal';
import { useToast } from '@/lib/toast-context';
import { AppearanceContext } from '@/lib/appearance-context';
import type { Density, FontSize } from '@/lib/appearance-context';
import {
  setDensityPreference,
  setFontSizePreference,
  useDensityPreference,
  useFontSizePreference,
} from '@/lib/appearance-preferences';
import { CHANNELS } from '@/lib/data';
import { useMe, ME_KEY } from '@/hooks/auth';
import { authApi } from '@/lib/api/auth';
import { channelsApi } from '@/lib/api/channels';
import { workspacesApi } from '@/lib/api/workspaces';
import { clearOauthIntent, getOauthIntent, setSessionHint } from '@/lib/auth-session-hint';
import type { AuthUser, ChannelSummary, WorkspaceSummary } from '@/lib/api/types';
import { getWorkspacePath } from '@/lib/workspace-routing';

interface ActiveView {
  type: 'channel' | 'dm';
  id: string;
}

interface Overlays {
  search: boolean;
  shortcuts: boolean;
  info: boolean;
  createChannel: boolean;
}

interface CallState {
  open: boolean;
  muted: boolean;
  camOff: boolean;
  sharing: boolean;
}

interface WorkspacePageProps {
  routeWorkspaceSlug: string;
  initialUser?: AuthUser | null;
  initialWorkspaces?: WorkspaceSummary[] | null;
  initialChannels?: ChannelSummary[] | null;
}

export default function WorkspacePage({
  routeWorkspaceSlug,
  initialUser = null,
  initialWorkspaces = null,
  initialChannels = null,
}: WorkspacePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isError: isMeError } = useMe(initialUser);
  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
    enabled: Boolean(me),
    initialData: initialWorkspaces ?? undefined,
    retry: false,
    staleTime: 60_000,
  });
  const channelsQuery = useQuery({
    queryKey: ['channels', me?.currentWorkspace?.id],
    queryFn: () => channelsApi.list(me?.currentWorkspace?.id as string),
    enabled: Boolean(me?.currentWorkspace?.id),
    initialData: me?.currentWorkspace?.id === initialUser?.currentWorkspace?.id
      ? (initialChannels ?? undefined)
      : undefined,
    retry: false,
    staleTime: 60_000,
  });
  const setCurrentWorkspace = useMutation({
    mutationFn: authApi.setCurrentWorkspace,
    onSuccess: (user, variables) => {
      queryClient.setQueryData(ME_KEY, user);

      const selectedWorkspace = workspacesQuery.data?.find(
        (workspace) => workspace.id === variables.workspaceId,
      );
      const nextWorkspacePath = getWorkspacePath(
        user.currentWorkspace?.slug ?? selectedWorkspace?.slug,
      );

      if (routeWorkspaceSlug !== nextWorkspacePath.slice(1)) {
        router.replace(nextWorkspacePath);
      }
    },
  });
  const [active, setActive] = useState<ActiveView>({ type: 'channel', id: 'engineering' });
  const [threadId, setThreadId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [ov, setOv] = useState<Overlays>({ search: false, shortcuts: false, info: false, createChannel: false });
  const [profileUser, setProfileUser] = useState<string | null>(null);
  const [call, setCall] = useState<CallState>({ open: false, muted: false, camOff: false, sharing: false });
  const { show: flashToast } = useToast();
  const density = useDensityPreference();
  const fontSize = useFontSizePreference();
  const hasUserWithoutWorkspace = Boolean(me && !me.currentWorkspace?.id);
  const workspacePath = getWorkspacePath(me?.currentWorkspace?.slug);
  const workspaceChannels = channelsQuery.data ?? [];
  const fallbackChannelIds = CHANNELS.map((channel) => channel.id);
  const navigableChannelIds = workspaceChannels.length > 0
    ? workspaceChannels.map((channel) => channel.id)
    : fallbackChannelIds;
  const defaultChannelId = workspaceChannels.find((channel) => channel.isGeneral)?.id
    ?? workspaceChannels[0]?.id
    ?? fallbackChannelIds[0]
    ?? 'general';
  const activeChannelExists = active.type !== 'channel'
    || !workspaceChannels.length
    || workspaceChannels.some((channel) => channel.id === active.id);
  const effectiveActive = active.type === 'channel' && !activeChannelExists
    ? { type: 'channel' as const, id: defaultChannelId }
    : active;

  useEffect(() => {
    if (me) {
      setSessionHint();
    }
  }, [me]);

  useEffect(() => {
    if (isMeError) {
      router.replace('/login');
    }
  }, [isMeError, router]);

  useEffect(() => {
    if (!me || me.currentWorkspace?.id || !workspacesQuery.isSuccess || setCurrentWorkspace.isPending) {
      return;
    }

    const oauthIntent = getOauthIntent();

    if (oauthIntent === 'signup') {
      clearOauthIntent();
      router.replace('/onboarding');
      return;
    }

    if (workspacesQuery.data.length === 0) {
      clearOauthIntent();
      router.replace('/onboarding');
      return;
    }

    clearOauthIntent();
    setCurrentWorkspace.mutate({
      workspaceId: workspacesQuery.data[0].id,
    });
  }, [
    me,
    router,
    setCurrentWorkspace,
    workspacesQuery.data,
    workspacesQuery.isSuccess,
  ]);

  useEffect(() => {
    if (!me?.currentWorkspace?.slug) {
      return;
    }

    if (routeWorkspaceSlug !== me.currentWorkspace.slug) {
      router.replace(workspacePath);
    }
  }, [me?.currentWorkspace?.slug, routeWorkspaceSlug, router, workspacePath]);

  useEffect(() => {
    const oauthWelcome = localStorage.getItem('oauth_welcome');

    if (oauthWelcome) {
      localStorage.removeItem('oauth_welcome');
      const providerName = oauthWelcome === 'github' ? 'GitHub' : 'Google';
      flashToast(`Signed in with ${providerName}`, {
        type: 'success',
        description: 'Welcome to Teamflow!',
      });
    }
  }, [flashToast]);

  const setDensity = (d: Density) => { setDensityPreference(d); };
  const setFontSize = (f: FontSize) => { setFontSizePreference(f); };

  const FONT_MAP: Record<FontSize, string> = { small: '13px', default: '14px', large: '16px' };

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
      const ids = navigableChannelIds;
      let idx = cur.type === 'channel' ? ids.indexOf(cur.id) : 0;
      if (idx === -1) {
        idx = 0;
      }
      idx = (idx + dir + ids.length) % ids.length;
      return { type: 'channel', id: ids[idx] };
    });
    setThreadId(null);
  }, [navigableChannelIds]);

  const jumpChannel = useCallback((i: number) => {
    if (i >= 0 && i < navigableChannelIds.length) {
      selectChannel(navigableChannelIds[i]);
    }
  }, [navigableChannelIds, selectChannel]);

  const openCompose = useCallback(() => {
    selectDm('sarah');
    flashToast('New message');
  }, [selectDm, flashToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
      const k = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const modalOpen = ov.search || ov.shortcuts || call.open || ov.info || ov.createChannel;

      if ((k === '?' && !typing) || (ctrl && k === '/')) {
        e.preventDefault();
        setOv((o) => ({ ...o, search: false, shortcuts: !o.shortcuts }));
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

  if (
    (!me && !isMeError) ||
    (hasUserWithoutWorkspace && (workspacesQuery.isLoading || setCurrentWorkspace.isPending))
  ) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6">
          <p className="text-[14px] text-sub">
            {setCurrentWorkspace.isPending
              ? 'Opening your workspace…'
              : 'Checking your workspace…'}
          </p>
        </div>
      </div>
    );
  }

  if (!me?.currentWorkspace?.id) {
    return null;
  }

  return (
    <AppearanceContext.Provider value={{ density, fontSize, setDensity, setFontSize }}>
      <div className="h-screen flex overflow-hidden" style={{ '--fs': FONT_MAP[fontSize] } as React.CSSProperties}>
        <Sidebar
          collapsed={collapsed}
          active={effectiveActive}
          channels={workspaceChannels}
          channelsLoading={channelsQuery.isLoading && workspaceChannels.length === 0}
          onSelect={onSelect}
          openAddChannel={() => setOv((o) => ({ ...o, createChannel: true }))}
          openSearch={() => setOv((o) => ({ ...o, search: true }))}
          openSettings={() => undefined}
          openShortcuts={() => setOv((o) => ({ ...o, shortcuts: true }))}
          openProfile={setProfileUser}
          openCompose={openCompose}
        />

        <ChannelView
          active={effectiveActive}
          workspaceId={me.currentWorkspace.id}
          channels={workspaceChannels}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          openSearch={() => setOv((o) => ({ ...o, search: true }))}
          openCall={() => setCall((c) => ({ ...c, open: true }))}
          openThread={setThreadId}
          openProfile={setProfileUser}
          openInfo={() => setOv((o) => ({ ...o, info: !o.info }))}
          infoOpen={ov.info}
        />

        {ov.info && (
          <ChannelInfoPanel
            active={effectiveActive}
            workspaceId={me.currentWorkspace.id}
            channels={workspaceChannels}
            onClose={() => setOv((o) => ({ ...o, info: false }))}
            onOpenProfile={setProfileUser}
          />
        )}

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
        {ov.createChannel && (
          <CreateChannelModal
            workspaceId={me.currentWorkspace.id}
            onClose={() => setOv((o) => ({ ...o, createChannel: false }))}
            onCreated={(channel) => {
              setOv((o) => ({ ...o, createChannel: false, info: false }));
              selectChannel(channel.id);
            }}
          />
        )}
        {profileUser && (
          <ProfilePopover
            userId={profileUser}
            onClose={() => setProfileUser(null)}
            onMessage={(id) => { setProfileUser(null); selectDm(id); }}
          />
        )}
      </div>
    </AppearanceContext.Provider>
  );
}
