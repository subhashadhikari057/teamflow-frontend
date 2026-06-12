'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import Tooltip from '@/components/primitives/Tooltip';
import { DMS, USERS } from '@/lib/data';
import { ME_KEY, useCurrentUser, useLogout } from '@/hooks/auth';
import { authApi } from '@/lib/api/auth';
import { getWorkspaceErrorMessage } from '@/lib/api/errors';
import { workspacesApi } from '@/lib/api/workspaces';
import { useToast } from '@/lib/toast-context';
import type { ChannelSummary, UserStatus, WorkspaceSummary } from '@/lib/api/types';
import { getSettingsPath, getWorkspacePath } from '@/lib/workspace-routing';

const STATUS_COLOR: Record<UserStatus, string> = {
  ONLINE:         '#22c55e',
  AWAY:           '#eab308',
  BUSY:           '#ef4444',
  DO_NOT_DISTURB: '#ef4444',
  FOCUSING:       '#a855f7',
  IN_A_MEETING:   '#3b82f6',
  ON_VACATION:    '#14b8a6',
  OUT_OF_OFFICE:  '#f97316',
  OFFLINE:        '#6b7280',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  ONLINE:         'Online',
  AWAY:           'Away',
  BUSY:           'Busy',
  DO_NOT_DISTURB: 'Do not disturb',
  FOCUSING:       'Focusing',
  IN_A_MEETING:   'In a meeting',
  ON_VACATION:    'On vacation',
  OUT_OF_OFFICE:  'Out of office',
  OFFLINE:        'Offline',
};

interface ActiveView {
  type: 'channel' | 'dm';
  id: string;
}

interface SidebarProps {
  collapsed: boolean;
  active: ActiveView;
  channels: ChannelSummary[];
  channelsLoading: boolean;
  onSelect: (a: ActiveView) => void;
  openAddChannel: () => void;
  openSearch: () => void;
  openSettings: () => void;
  openShortcuts: () => void;
  openProfile: (userId: string) => void;
  openCompose: () => void;
}

function SidebarItem({
  icon, label, active, badge, collapsed, onClick,
}: {
  icon: string; label: string; active?: boolean; badge?: number; collapsed: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ fontSize: 'var(--fs, 14px)' }}
      className={`w-full flex items-center gap-2.5 rounded-md px-2.5 h-8 transition group ${
        active ? 'bg-elevated text-ink' : 'text-sub hover:bg-elevated hover:text-ink'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Icon name={icon} size={17} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="ml-auto text-[11px] font-semibold bg-white text-black rounded px-1.5 py-px">{badge}</span>
      )}
    </button>
  );
}

function WorkspaceAvatar({
  workspace,
  size = 32,
}: {
  workspace: Pick<WorkspaceSummary, 'logoUrl' | 'name'>;
  size?: number;
}) {
  const workspaceInitial = workspace.name.trim().charAt(0).toUpperCase() || 'N';

  if (workspace.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={workspace.logoUrl}
        alt={workspace.name}
        className="rounded-md object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-md bg-white text-black flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: Math.max(12, Math.floor(size * 0.44)) }}
    >
      {workspaceInitial}
    </div>
  );
}

export default function Sidebar({
  collapsed, active, channels, channelsLoading, onSelect, openAddChannel, openSearch, openSettings, openShortcuts, openProfile, openCompose,
}: SidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast   = useToast();
  const logout  = useLogout();
  const me      = useCurrentUser();
  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
    enabled: Boolean(me),
    refetchOnMount: 'always',
    staleTime: 60_000,
  });
  const workspaceName = me?.currentWorkspace?.name ?? 'Workspace';
  const workspaceSlug = me?.currentWorkspace?.slug ?? null;
  const currentWorkspace = workspacesQuery.data?.find((workspace) => workspace.id === me?.currentWorkspace?.id) ?? null;
  const workspaceAvatarSource = currentWorkspace ?? {
    name: workspaceName,
    logoUrl: null,
  };
  const [chanOpen, setChanOpen] = useState(true);
  const [dmOpen, setDmOpen] = useState(true);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const switchWorkspace = useMutation({
    mutationFn: (workspaceId: string) => authApi.setCurrentWorkspace({ workspaceId }),
    onSuccess: (user, workspaceId) => {
      const nextWorkspace = workspacesQuery.data?.find((workspace) => workspace.id === workspaceId);

      queryClient.setQueryData(ME_KEY, user);

      if (nextWorkspace) {
        queryClient.setQueryData(['workspace', nextWorkspace.id], nextWorkspace);
      }

      setWorkspaceMenuOpen(false);
      router.replace(getWorkspacePath(user.currentWorkspace?.slug ?? nextWorkspace?.slug));
    },
    onError: (error) => {
      toast.error(getWorkspaceErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!workspaceMenuOpen) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setWorkspaceMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [workspaceMenuOpen]);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
    } catch {
      // ignore — still clear local state and redirect
    }
    toast.success('Logged out');
    router.push('/login');
  }

  function handleWorkspaceSelect(workspace: WorkspaceSummary) {
    if (workspace.id === me?.currentWorkspace?.id) {
      setWorkspaceMenuOpen(false);
      return;
    }

    switchWorkspace.mutate(workspace.id);
  }

  function goToWorkspaceSettings() {
    setWorkspaceMenuOpen(false);
    openSettings();
    router.push(getSettingsPath(workspaceSlug));
  }

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-divider shrink-0 transition-all duration-150 ${
        collapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      {/* Workspace header */}
      <div className="h-14 flex items-center px-3 border-b border-divider">
        <div
          ref={workspaceMenuRef}
          className={`relative ${collapsed ? 'w-full' : 'flex-1'}`}
        >
          <button
            onClick={() => {
              if (!workspaceMenuOpen) {
                void workspacesQuery.refetch();
              }

              setWorkspaceMenuOpen((open) => !open);
            }}
            aria-haspopup="menu"
            aria-expanded={workspaceMenuOpen}
            className={`flex items-center gap-2.5 rounded-md hover:bg-elevated transition px-1.5 h-10 ${
              collapsed ? 'justify-center w-full' : 'w-full'
            }`}
          >
            <WorkspaceAvatar workspace={workspaceAvatarSource} />
            {!collapsed && (
              <>
                <span className="text-[15px] font-semibold text-ink tracking-tightest flex-1 text-left truncate">
                  {workspaceName}
                </span>
                <Icon
                  name="chevdown"
                  size={15}
                  className={`text-sub transition-transform ${workspaceMenuOpen ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>

          {workspaceMenuOpen && (
            <div
              className={`absolute z-40 top-[calc(100%+8px)] rounded-lg border border-line bg-panel shadow-xl p-2 ${
                collapsed ? 'left-0 w-[280px]' : 'left-0 right-0'
              }`}
            >
              <div className="px-2 pt-1 pb-2">
                <div className="text-[11px] uppercase tracking-wider text-muted">Your workspaces</div>
              </div>

              {workspacesQuery.isLoading ? (
                <div className="px-2 py-3 text-[13px] text-sub">Loading workspaces…</div>
              ) : workspacesQuery.isError ? (
                <div className="px-2 py-3 text-[13px] text-sub">
                  We couldn&apos;t load your workspaces right now.
                </div>
              ) : (
                <div className="space-y-1 max-h-[280px] overflow-y-auto no-scrollbar">
                  {(workspacesQuery.data ?? []).map((workspace) => {
                    const isCurrent = workspace.id === me?.currentWorkspace?.id;
                    const isSwitching = switchWorkspace.isPending && switchWorkspace.variables === workspace.id;

                    return (
                      <button
                        key={workspace.id}
                        onClick={() => handleWorkspaceSelect(workspace)}
                        disabled={switchWorkspace.isPending}
                        className={`w-full flex items-center gap-3 rounded-md px-2 py-2 text-left transition ${
                          isCurrent
                            ? 'bg-elevated text-ink'
                            : 'text-sub hover:bg-elevated hover:text-ink'
                        }`}
                      >
                        <WorkspaceAvatar workspace={workspace} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium truncate">{workspace.name}</div>
                          <div className="text-[11px] text-sub truncate">teamflow.io/{workspace.slug}</div>
                        </div>
                        {isSwitching ? (
                          <span className="text-[11px] text-sub">Switching…</span>
                        ) : isCurrent ? (
                          <Icon name="check" size={14} className="text-ink shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 border-t border-divider pt-2">
                <button
                  onClick={goToWorkspaceSettings}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-[13px] text-sub hover:bg-elevated hover:text-ink transition"
                >
                  <Icon name="settings" size={14} />
                  Workspace settings
                </button>
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <Tooltip label="New message" keys={['Ctrl', 'T']} side="bottom">
            <button
              onClick={openCompose}
              className="w-8 h-8 rounded-md border border-line text-ink hover:border-[#555555] hover:bg-elevated flex items-center justify-center transition ml-1"
            >
              <Icon name="compose" size={15} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <button
          onClick={openSearch}
          className={`w-full flex items-center gap-2 rounded-md bg-panel border border-line hover:border-[#555555] transition h-9 ${
            collapsed ? 'justify-center px-0' : 'px-2.5'
          }`}
        >
          <Icon name="search" size={15} className="text-muted shrink-0" />
          {!collapsed && (
            <>
              <span className="text-[13px] text-muted flex-1 text-left">Search</span>
              <span className="flex items-center gap-0.5">
                <span className="kbd" style={{ minWidth: 18, height: 18, fontSize: 10 }}>⌘</span>
                <span className="kbd" style={{ minWidth: 18, height: 18, fontSize: 10 }}>K</span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Nav shortcuts */}
      <div className="px-3 pt-3 space-y-0.5">
        <SidebarItem icon="home" label="Home" active collapsed={collapsed} />
        <SidebarItem icon="dm" label="DMs" collapsed={collapsed} onClick={() => onSelect({ type: 'dm', id: 'sarah' })} />
        <SidebarItem icon="bell" label="Activity" badge={4} collapsed={collapsed} />
        <SidebarItem icon="bookmark" label="Later" collapsed={collapsed} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 pt-5 no-scrollbar">
        {/* Channels */}
        <div>
          <div className={`flex items-center gap-1 mb-1 ${collapsed ? 'justify-center' : 'px-1'}`}>
            {!collapsed && (
              <button
                onClick={() => setChanOpen((o) => !o)}
                className="flex items-center gap-1 text-[12px] uppercase tracking-wider text-muted hover:text-sub transition flex-1"
              >
                <Icon
                  name="chevright"
                  size={12}
                  className={`transition-transform ${chanOpen ? 'rotate-90' : ''}`}
                />
                Channels
              </button>
            )}
            {!collapsed && (
              <button
                onClick={openAddChannel}
                className="w-5 h-5 rounded text-muted hover:text-ink hover:bg-elevated flex items-center justify-center transition"
                aria-label="Create channel"
              >
                <Icon name="plus" size={13} />
              </button>
            )}
          </div>

          {(chanOpen || collapsed) && (
            <>
              {channelsLoading ? (
                <div className={`text-[12px] text-muted ${collapsed ? 'text-center' : 'px-2.5 py-1'}`}>
                  {collapsed ? '…' : 'Loading…'}
                </div>
              ) : channels.length === 0 ? (
                !collapsed ? (
                  <div className="px-2.5 py-1 text-[12px] text-muted">No channels yet</div>
                ) : null
              ) : (
                <div className="space-y-0.5">
                  {channels.map((channel) => {
                    const isActive = active.type === 'channel' && active.id === channel.id;
                    const iconName = channel.type === 'PRIVATE' ? 'lock' : 'hash';

                    return (
                      <button
                        key={channel.id}
                        onClick={() => onSelect({ type: 'channel', id: channel.id })}
                        style={{ fontSize: 'var(--fs, 14px)' }}
                        className={`w-full flex items-center gap-1.5 rounded-md px-2.5 h-7 transition ${
                          isActive
                            ? 'bg-elevated text-ink'
                            : 'text-sub hover:bg-elevated hover:text-ink'
                        } ${collapsed ? 'justify-center px-0' : ''}`}
                      >
                        {collapsed ? (
                          <Icon name={iconName} size={15} />
                        ) : (
                          <span className="text-muted">
                            {channel.type === 'PRIVATE' ? <Icon name="lock" size={13} /> : '#'}
                          </span>
                        )}
                        {!collapsed && (
                          <span className={`truncate ${channel.isGeneral ? 'font-semibold text-ink' : ''}`}>
                            {channel.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* DMs */}
        <div className="mt-5">
          {!collapsed && (
            <button
              onClick={() => setDmOpen((o) => !o)}
              className="flex items-center gap-1 text-[12px] uppercase tracking-wider text-muted hover:text-sub transition mb-1 px-1 w-full"
            >
              <Icon
                name="chevright"
                size={12}
                className={`transition-transform ${dmOpen ? 'rotate-90' : ''}`}
              />
              Direct Messages
            </button>
          )}

          {(dmOpen || collapsed) && (
            <div className="space-y-0.5">
              {DMS.map((d) => {
                const u = USERS[d.userId];
                const isActive = active.type === 'dm' && active.id === d.userId;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelect({ type: 'dm', id: d.userId })}
                    style={{ fontSize: 'var(--fs, 14px)' }}
                    className={`w-full flex items-center gap-2 rounded-md px-2 h-8 transition ${
                      isActive ? 'bg-elevated text-ink' : 'text-sub hover:bg-elevated hover:text-ink'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Avatar userId={d.userId} size={22} />
                    {!collapsed && (
                      <span className={`truncate ${d.unread ? 'font-semibold text-ink' : ''}`}>
                        {u.name}
                      </span>
                    )}
                    {!collapsed && d.unread > 0 && (
                      <span className="ml-auto text-[11px] font-semibold bg-white text-black rounded px-1.5 py-px">
                        {d.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={openShortcuts}
            className="mt-6 mb-2 px-2 text-[12px] text-muted hover:text-sub transition"
          >
            ? for shortcuts
          </button>
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-divider p-2.5 flex items-center gap-1.5">
        <button
          onClick={() => openProfile(me?.id ?? '')}
          className="flex items-center gap-2 flex-1 min-w-0 rounded-md hover:bg-elevated transition p-1.5"
        >
          {/* Avatar */}
          {me?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatarUrl} alt={me.name} className="shrink-0 rounded-md object-cover" style={{ width: 30, height: 30 }} />
          ) : (
            <div
              className="shrink-0 rounded-md flex items-center justify-center font-semibold text-white select-none"
              style={{ width: 30, height: 30, fontSize: 12, background: '#3b3b3b', letterSpacing: '-0.02em' }}
            >
              {me?.name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
            </div>
          )}

          {!collapsed && me && (
            <div className="text-left min-w-0">
              <div className="text-[13px] font-semibold text-ink truncate leading-tight">{me.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                {me.status ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_COLOR[me.status] }} />
                    <span className="text-[11px] text-sub truncate">{STATUS_LABEL[me.status]}</span>
                  </>
                ) : (
                  <span className="text-[11px] text-muted truncate">@{me.username}</span>
                )}
              </div>
            </div>
          )}
        </button>

        {!collapsed && (
          <>
            <Tooltip label="Settings" side="top">
              <button
                onClick={goToWorkspaceSettings}
                className="w-7 h-7 rounded-md text-sub hover:text-ink hover:bg-elevated flex items-center justify-center transition"
              >
                <Icon name="settings" size={15} />
              </button>
            </Tooltip>
            <Tooltip label="Log out" side="top">
              <button
                onClick={handleLogout}
                disabled={logout.isPending}
                className="w-7 h-7 rounded-md text-sub hover:text-danger hover:bg-elevated flex items-center justify-center transition"
              >
                <Icon name="logout" size={15} />
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </aside>
  );
}
