'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import Tooltip from '@/components/primitives/Tooltip';
import { CHANNELS, DMS, CURRENT_USER, USERS } from '@/lib/data';

interface ActiveView {
  type: 'channel' | 'dm';
  id: string;
}

interface SidebarProps {
  collapsed: boolean;
  active: ActiveView;
  onSelect: (a: ActiveView) => void;
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

export default function Sidebar({
  collapsed, active, onSelect, openSearch, openSettings, openShortcuts, openProfile, openCompose,
}: SidebarProps) {
  const router = useRouter();
  const [chanOpen, setChanOpen] = useState(true);
  const [dmOpen, setDmOpen] = useState(true);

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-divider shrink-0 transition-all duration-150 ${
        collapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      {/* Workspace header */}
      <div className="h-14 flex items-center px-3 border-b border-divider">
        <button
          className={`flex items-center gap-2.5 rounded-md hover:bg-elevated transition px-1.5 h-10 ${
            collapsed ? 'justify-center w-full' : 'flex-1'
          }`}
        >
          <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center text-[14px] font-bold shrink-0">
            N
          </div>
          {!collapsed && (
            <>
              <span className="text-[15px] font-semibold text-ink tracking-tightest flex-1 text-left truncate">
                Nomor
              </span>
              <Icon name="chevdown" size={15} className="text-sub" />
            </>
          )}
        </button>
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
              <button className="w-5 h-5 rounded text-muted hover:text-ink hover:bg-elevated flex items-center justify-center transition">
                <Icon name="plus" size={13} />
              </button>
            )}
          </div>

          {(chanOpen || collapsed) && (
            <div className="space-y-0.5">
              {CHANNELS.map((c) => {
                const isActive = active.type === 'channel' && active.id === c.id;
                const unread = c.unread > 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelect({ type: 'channel', id: c.id })}
                    style={{ fontSize: 'var(--fs, 14px)' }}
                    className={`w-full flex items-center gap-1.5 rounded-md px-2.5 h-7 transition ${
                      isActive
                        ? 'bg-elevated text-ink'
                        : unread
                        ? 'text-ink hover:bg-elevated'
                        : 'text-sub hover:bg-elevated hover:text-ink'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    {collapsed ? (
                      <Icon name="hash" size={15} />
                    ) : (
                      <span className="text-muted">#</span>
                    )}
                    {!collapsed && (
                      <span className={`truncate ${unread ? 'font-semibold' : ''}`}>{c.name}</span>
                    )}
                    {!collapsed && unread && (
                      <span className="ml-auto text-[11px] font-semibold bg-white text-black rounded px-1.5 py-px">
                        {c.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
      <div className="border-t border-divider p-2.5 flex items-center gap-2.5">
        <button
          onClick={() => openProfile('ashim')}
          className="flex items-center gap-2.5 flex-1 min-w-0 rounded-md hover:bg-elevated transition p-1 -m-1"
        >
          <Avatar userId="ashim" size={32} />
          {!collapsed && (
            <div className="text-left min-w-0">
              <div className="text-[13px] font-semibold text-ink truncate">Ashim</div>
              <div className="text-[11px] text-sub truncate">{CURRENT_USER.status}</div>
            </div>
          )}
        </button>
        {!collapsed && (
          <Tooltip label="Settings" side="top">
            <button
              onClick={() => router.push('/settings?from=nomor')}
              className="w-8 h-8 rounded-md text-sub hover:text-ink hover:bg-elevated flex items-center justify-center transition"
            >
              <Icon name="settings" size={16} />
            </button>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
