'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Icon from '@/components/primitives/Icon';
import EditChannelModal from '@/components/app/EditChannelModal';
import { CHANNELS, USERS } from '@/lib/data';
import { channelsApi } from '@/lib/api/channels';
import type { ChannelDetail, ChannelMemberSummary, ChannelSummary } from '@/lib/api/types';

interface ActiveView {
  type: 'channel' | 'dm';
  id: string;
}

interface Props {
  active: ActiveView;
  workspaceId: string;
  channels: ChannelSummary[];
  onClose: () => void;
  onOpenProfile: (userId: string) => void;
}

const PRESENCE_COLOR: Record<string, string> = {
  online:  '#22c55e',
  away:    '#eab308',
  offline: '#555555',
};

// ── Shared tab shell ─────────────────────────────────────────────────

const CHANNEL_TABS = ['About', 'Members', 'Files', 'Pinned'] as const;
const DM_TABS      = ['Profile', 'Files', 'Pinned'] as const;
const EMPTY_CHANNEL_MEMBERS: ChannelMemberSummary[] = [];

// ── About tab ────────────────────────────────────────────────────────

function formatChannelCreatedAt(value?: string) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function ChannelMemberAvatar({ member }: { member: ChannelMemberSummary }) {
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt={member.name ?? member.username}
        className="w-[30px] h-[30px] rounded-lg object-cover shrink-0 border border-line"
      />
    );
  }

  return (
    <div
      className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center text-[12px] font-semibold text-white select-none"
      style={{ background: '#3b82f6' }}
    >
      {getInitials(member.name ?? member.username)}
    </div>
  );
}

function AboutTab({
  channel,
  creatorLabel,
  memberCount,
  onEdit,
}: {
  channel: ChannelSummary;
  creatorLabel: string;
  memberCount: number;
  onEdit: () => void;
}) {
  const description = channel.description?.trim() || 'No description set';
  const topic = channel.topic?.trim() || 'No topic set';
  const privacyLabel = channel.type === 'PRIVATE' ? 'Private' : 'Public';
  const postingLabel = channel.isReadOnly ? 'Read only' : 'Open to members';
  const canEdit = !channel.isGeneral;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2 min-w-0">
          <ChannelMetaBadge icon={channel.type === 'PRIVATE' ? 'lock' : 'globe'} label={privacyLabel} />
          {channel.isGeneral && <ChannelMetaBadge icon="hash" label="General" />}
          {channel.isReadOnly && <ChannelMetaBadge icon="info" label="Read only" />}
          {channel.isArchived && <ChannelMetaBadge icon="warning" label="Archived" />}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-muted hover:text-ink hover:bg-elevated transition"
            aria-label="Edit channel"
            title="Edit channel"
          >
            <Icon name="compose" size={13} />
          </button>
        )}
      </div>

      {/* Description */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Description</div>
        <p className={`text-[13px] leading-[1.65] ${description === 'No description set' ? 'text-muted italic' : 'text-sub'}`}>
          {description}
        </p>
      </div>

      {/* Topic */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Topic</div>
        <p className={`text-[13px] ${topic === 'No topic set' ? 'text-muted italic' : 'text-sub'}`}>{topic}</p>
      </div>

      {/* Meta */}
      <div className="space-y-2.5">
        <MetaRow icon="users" label="Members"  value={String(memberCount)} />
        <MetaRow icon={channel.type === 'PRIVATE' ? 'lock' : 'globe'} label="Privacy" value={privacyLabel} />
        <MetaRow icon="compose" label="Posting" value={postingLabel} />
        <MetaRow icon="hash" label="Created" value={formatChannelCreatedAt(channel.createdAt)} />
        <MetaRow icon="at" label="Created by" value={creatorLabel} />
      </div>
    </div>
  );
}

// ── Members tab ──────────────────────────────────────────────────────

function MembersTab({
  members,
  isLoading,
  isError,
  onOpenProfile,
}: {
  members: ChannelMemberSummary[];
  isLoading: boolean;
  isError: boolean;
  onOpenProfile: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = members.filter((member) =>
    `${member.name ?? ''} ${member.username}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-divider">
        <div className="relative">
          <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a member…"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-elevated border border-line text-[13px] text-ink placeholder:text-muted outline-none focus:border-[#555555] transition"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="px-2 py-10 text-center text-[13px] text-sub">Loading members…</div>
        ) : isError ? (
          <div className="px-2 py-10 text-center text-[13px] text-sub">
            We couldn&apos;t load this channel&apos;s members right now.
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-2 py-10 text-center text-[13px] text-sub">
            {members.length === 0 ? 'No members found for this channel.' : 'No members match your search.'}
          </div>
        ) : (
          <>
        <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold px-2 py-1.5">
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </div>
        {filtered.map((member) => (
          <button
            key={member.id}
            onClick={() => onOpenProfile(member.userId)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-elevated transition text-left"
          >
            <ChannelMemberAvatar member={member} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink truncate">{member.name ?? member.username}</div>
              <div className="text-[11px] text-muted truncate">@{member.username} · {member.role}</div>
            </div>
          </button>
        ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Files tab ────────────────────────────────────────────────────────

const MOCK_FILES = [
  { name: 'release-notes-v2.4.md', type: 'Markdown', size: '12 KB', from: 'Sarah', icon: 'folder' },
  { name: 'thread-panel-spec.fig',  type: 'Figma',    size: '—',     from: 'Priya', icon: 'folder' },
];

function FilesTab() {
  if (MOCK_FILES.length === 0) {
    return <Empty icon="folder" text="No files shared yet" />;
  }
  return (
    <div className="p-3 space-y-1">
      {MOCK_FILES.map((f) => (
        <div key={f.name} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-elevated transition cursor-pointer">
          <div className="w-8 h-8 rounded-md bg-elevated border border-divider flex items-center justify-center text-sub shrink-0">
            <Icon name="folder" size={15} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-ink truncate font-medium">{f.name}</div>
            <div className="text-[11px] text-muted mt-0.5">{f.type} · {f.size} · {f.from}</div>
          </div>
          <button className="text-muted hover:text-ink transition shrink-0">
            <Icon name="arrowright" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Pinned tab ───────────────────────────────────────────────────────

function PinnedTab() {
  return <Empty icon="pin" text="No pinned messages" sub="Pin important messages so the team can find them fast." />;
}

// ── DM Profile tab ───────────────────────────────────────────────────

function DmProfileTab({ userId, onOpenProfile }: { userId: string; onOpenProfile: (id: string) => void }) {
  const u = USERS[userId];
  if (!u) return null;
  return (
    <div className="p-4 space-y-5">
      <div className="flex flex-col items-center text-center gap-3 pb-5 border-b border-divider">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
            style={{ background: u.color, letterSpacing: '-0.02em' }}
          >
            {u.initials}
          </div>
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg"
            style={{ background: PRESENCE_COLOR[u.presence] }}
          />
        </div>
        <div>
          <div className="text-[16px] font-semibold text-ink">{u.name}</div>
          <div className="text-[13px] text-sub mt-0.5 capitalize">{u.presence}</div>
        </div>
        {u.status && (
          <div className="w-full text-[13px] text-ink bg-elevated border border-divider rounded-md px-3 py-2 text-left">
            {u.status}
          </div>
        )}
        <button onClick={() => onOpenProfile(userId)} className="w-full h-8 rounded-md border border-line text-[13px] text-sub hover:text-ink hover:border-[#555555] transition">
          View full profile
        </button>
      </div>

      <div className="space-y-2.5">
        <MetaRow icon="at"    label="Username" value={u.name.toLowerCase().replace(' ', '.')} />
        <MetaRow icon="globe" label="Timezone" value={u.tz} />
        <MetaRow icon="users" label="Role"     value={u.role} />
      </div>
    </div>
  );
}

// ── Shared helpers ───────────────────────────────────────────────────

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={14} className="text-muted shrink-0" />
      <span className="text-[12px] text-muted w-16 shrink-0">{label}</span>
      <span className="text-[13px] text-ink truncate">{value}</span>
    </div>
  );
}

function ChannelMetaBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-elevated border border-line text-sub">
      <Icon name={icon} size={12} />
      {label}
    </span>
  );
}

function Empty({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 gap-2 text-center">
      <Icon name={icon} size={24} className="text-muted" strokeWidth={1.5} />
      <span className="text-[13px] text-sub">{text}</span>
      {sub && <span className="text-[12px] text-muted leading-snug">{sub}</span>}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────

export default function ChannelInfoPanel({ active, workspaceId, channels, onClose, onOpenProfile }: Props) {
  const isDm = active.type === 'dm';
  const apiChannel = !isDm ? channels.find((channel) => channel.id === active.id) ?? null : null;
  const fallbackChannel = !isDm ? CHANNELS.find((channel) => channel.id === active.id) ?? null : null;
  const channelDetailQuery = useQuery({
    queryKey: ['channel', workspaceId, active.id],
    queryFn: () => channelsApi.getById(workspaceId, active.id, { member: true }),
    enabled: !isDm,
    placeholderData: apiChannel ?? undefined,
    staleTime: 60_000,
  });
  const channel = (channelDetailQuery.data ?? apiChannel) as ChannelDetail | ChannelSummary | null;
  const channelName = channel?.name ?? fallbackChannel?.name ?? active.id;
  const channelDetail = channel as ChannelDetail | null;
  const channelMembers = Array.isArray(channelDetail?.members)
    ? channelDetail.members
    : EMPTY_CHANNEL_MEMBERS;
  const creatorMember = useMemo(
    () => channelMembers.find((member) => member.userId === channel?.createdBy),
    [channel?.createdBy, channelMembers],
  );
  const creatorLabel = creatorMember?.name
    ?? (creatorMember?.username ? `@${creatorMember.username}` : channel?.createdBy || 'Unknown');
  const channelMemberCount = channelMembers.length || channel?.memberCount || fallbackChannel?.members || 0;
  const dmUser  = isDm ? USERS[active.id] : null;

  const tabs = isDm ? DM_TABS : CHANNEL_TABS;
  const [tab, setTab] = useState<string>(tabs[0]);
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      <aside className="w-[280px] shrink-0 border-l border-divider bg-bg flex flex-col anim-slide overflow-hidden">

        {/* Header */}
        <div className="h-14 border-b border-divider flex items-center justify-between px-4 shrink-0">
          <div className="min-w-0">
            {isDm ? (
              <div className="text-[15px] font-semibold text-ink tracking-tightest truncate">{dmUser!.name}</div>
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-muted text-[15px]">#</span>
                <span className="text-[15px] font-semibold text-ink tracking-tightest truncate">{channelName}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md text-sub hover:text-ink hover:bg-elevated flex items-center justify-center transition shrink-0"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-divider px-2 shrink-0">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3 py-2.5 text-[13px] font-medium transition whitespace-nowrap ${
                tab === t ? 'text-ink' : 'text-muted hover:text-sub'
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {!isDm && tab === 'About' && (
            channel ? (
              <AboutTab
                channel={channel}
                creatorLabel={creatorLabel}
                memberCount={channelMemberCount}
                onEdit={() => setEditModalOpen(true)}
              />
            ) : (
              <div className="px-4 py-10 text-center text-[13px] text-sub">
                We couldn&apos;t load this channel&apos;s details right now.
              </div>
            )
          )}
          {!isDm && tab === 'Members' && (
            <MembersTab
              members={channelMembers}
              isLoading={channelDetailQuery.isLoading}
              isError={channelDetailQuery.isError}
              onOpenProfile={onOpenProfile}
            />
          )}
          {tab === 'Files'            && <FilesTab />}
          {tab === 'Pinned'           && <PinnedTab />}
          {isDm  && tab === 'Profile' && <DmProfileTab userId={active.id} onOpenProfile={onOpenProfile} />}
        </div>
      </aside>

      {!isDm && editModalOpen && channel && !channel.isGeneral && (
        <EditChannelModal
          workspaceId={workspaceId}
          channel={channel}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </>
  );
}
