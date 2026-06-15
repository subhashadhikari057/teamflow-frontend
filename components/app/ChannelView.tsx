'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import Tooltip from '@/components/primitives/Tooltip';
import Badge from '@/components/primitives/Badge';
import MessageBody from './MessageBody';
import Composer from './Composer';
import { CHANNELS, ENG_MESSAGES, USERS } from '@/lib/data';
import { channelsApi } from '@/lib/api/channels';
import { getUploadFileUrl } from '@/lib/api/uploads';
import type { ChannelMemberSummary, ChannelSummary } from '@/lib/api/types';
import type { Message } from '@/lib/types';
import { useAppearance } from '@/lib/appearance-context';

interface ActiveView {
  type: 'channel' | 'dm';
  id: string;
}

interface ChannelViewProps {
  active: ActiveView;
  workspaceId: string;
  channels: ChannelSummary[];
  onToggleSidebar: () => void;
  openSearch: () => void;
  openCall: () => void;
  openThread: (id: string) => void;
  openProfile: (userId: string) => void;
  openInfo: () => void;
  infoOpen: boolean;
}

function Reaction({ r }: { r: { emoji: string; count: number; by: string[] } }) {
  const mine = r.by.includes('ashim');
  return (
    <button
      className={`lift inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[12px] transition ${
        mine
          ? 'border-white/40 bg-elevated text-ink'
          : 'border-line bg-panel text-sub hover:border-[#555555]'
      }`}
    >
      <span>{r.emoji}</span>
      <span className="font-medium">{r.count}</span>
    </button>
  );
}

function MessageRow({
  m, onOpenThread, onOpenProfile,
}: {
  m: Message;
  onOpenThread: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const u = USERS[m.userId];
  const [hover, setHover] = useState(false);
  const { density } = useAppearance();

  const isCozy     = density === 'cozy';
  const isCompact  = density === 'compact';
  const avatarSize = isCompact ? 30 : 36;
  const rowPy      = isCozy ? 'py-[3px]' : isCompact ? 'py-1' : 'py-1.5';

  const extras = (
    <>
      {m.reactions && m.reactions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {m.reactions.map((r, i) => <Reaction key={i} r={r} />)}
          <button className="lift inline-flex items-center justify-center w-7 h-6 rounded-md border border-line bg-panel text-muted hover:text-ink hover:border-[#555555] transition">
            <Icon name="smile" size={13} />
          </button>
        </div>
      )}
      {m.thread && (
        <button
          onClick={() => onOpenThread(m.id)}
          className="lift mt-2 inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-md border border-transparent hover:border-line hover:bg-panel transition"
        >
          <div className="flex -space-x-1.5">
            {m.thread.replies.slice(0, 3).map((r) => (
              <Avatar key={r.id} userId={r.userId} size={20} presence={false} ring />
            ))}
          </div>
          <span className="text-[12px] font-semibold text-[#6ea8fe]">
            {m.thread.replies.length} replies
          </span>
          <span className="text-[11px] text-muted">
            Last reply {m.thread.replies[m.thread.replies.length - 1].time}
          </span>
          <Icon name="chevright" size={13} className="text-muted" />
        </button>
      )}
    </>
  );

  const hoverActions = hover && (
    <div className="absolute -top-3 right-4 flex items-center bg-panel border border-line rounded-md anim-fade overflow-hidden">
      {(['smile', 'cornerreply', 'more'] as const).map((ic, i) => (
        <button
          key={ic}
          onClick={ic === 'cornerreply' ? () => onOpenThread(m.id) : undefined}
          className={`w-8 h-8 flex items-center justify-center text-sub hover:text-ink hover:bg-elevated transition ${
            i > 0 ? 'border-l border-divider' : ''
          }`}
        >
          <Icon name={ic} size={15} />
        </button>
      ))}
    </div>
  );

  /* ── Cozy: no avatar, time left, sender+body inline ─────────────── */
  if (isCozy) {
    return (
      <div
        className={`group relative flex items-baseline gap-2 px-5 ${rowPy} hover:bg-[#0c0c0c] transition rounded`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span className="text-[11px] text-muted w-14 text-right shrink-0 select-none">{m.time}</span>
        <button
          onClick={() => onOpenProfile(m.userId)}
          className="text-[13px] font-semibold text-ink hover:underline shrink-0"
        >
          {u.name}
        </button>
        <div className="min-w-0 flex-1" style={{ fontSize: 'var(--fs, 14px)' }}>
          <MessageBody body={m.body} />
          {extras}
        </div>
        {hoverActions}
      </div>
    );
  }

  /* ── Comfortable / Compact: avatar + stacked layout ─────────────── */
  return (
    <div
      className={`group relative flex gap-3 px-5 ${rowPy} hover:bg-[#0c0c0c] transition rounded`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button onClick={() => onOpenProfile(m.userId)} className="shrink-0 mt-0.5">
        <Avatar userId={m.userId} size={avatarSize} presence={false} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <button
            onClick={() => onOpenProfile(m.userId)}
            className="font-semibold text-ink hover:underline"
            style={{ fontSize: 'var(--fs, 14px)' }}
          >
            {u.name}
          </button>
          <span className="text-[11px] text-muted">{m.time}</span>
          {m.edited && <span className="text-[11px] text-muted">(edited)</span>}
        </div>
        <div className="mt-0.5" style={{ fontSize: 'var(--fs, 14px)' }}>
          <MessageBody body={m.body} />
        </div>
        {extras}
      </div>
      {hoverActions}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function ChannelHeaderAvatar({ member }: { member: ChannelMemberSummary }) {
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getUploadFileUrl(member.avatarUrl)}
        alt={member.name ?? member.username}
        className="w-6 h-6 rounded-md object-cover border border-bg shrink-0"
      />
    );
  }

  return (
    <div
      className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-semibold text-white select-none border border-bg"
      style={{ background: '#3b82f6' }}
    >
      {getInitials(member.name ?? member.username)}
    </div>
  );
}

function getSeedMessages({
  activeId,
  channelName,
  isDm,
}: {
  activeId: string;
  channelName: string;
  isDm: boolean;
}) {
  if (isDm) {
    return [
      {
        id: 'd1',
        userId: activeId,
        time: '8:40 AM',
        reactions: [],
        body: `Hey! Did you get a chance to look at the ${activeId === 'priya' ? 'design specs' : 'PR'}?`,
      },
      {
        id: 'd2',
        userId: 'ashim',
        time: '8:42 AM',
        reactions: [],
        body: 'Just reviewing now — looks great. Leaving a couple comments.',
      },
    ];
  }

  if (channelName === 'engineering') {
    return ENG_MESSAGES;
  }

  return [
    {
      id: 'g1',
      userId: 'sarah',
      time: '8:15 AM',
      reactions: [],
      body: `Welcome to **#${channelName}** 👋 — this is the start of the channel.`,
    },
  ];
}

function ConversationPane({
  channelIntro,
  channelName,
  composerLabel,
  isDm,
  openProfile,
  openThread,
  seedMessages,
  showTyping,
}: {
  channelIntro: string;
  channelName: string;
  composerLabel: string;
  isDm: boolean;
  openProfile: (userId: string) => void;
  openThread: (id: string) => void;
  seedMessages: Message[];
  showTyping: boolean;
}) {
  const { density } = useAppearance();
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [editing, setEditing] = useState<{ body: string; flag?: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (text: string) => {
    if (editing?.flag) {
      setMessages((prev) => {
        const idx = [...prev].reverse().findIndex((m) => m.userId === 'ashim');
        if (idx === -1) return prev;
        const realIdx = prev.length - 1 - idx;
        return prev.map((m, i) => (i === realIdx ? { ...m, body: text, edited: true } : m));
      });
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: `new-${prev.length}`, userId: 'ashim', time: 'now', body: text, reactions: [] },
    ]);
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {!isDm && (
          <div className="px-5 pb-4 mb-2">
            <div className="w-12 h-12 rounded-lg bg-elevated border border-line flex items-center justify-center text-ink mb-3">
              <Icon name="hash" size={22} />
            </div>
            <h2 className="text-[22px] font-bold tracking-tightest text-ink">
              Welcome to #{channelName}
            </h2>
            <p className="text-[14px] text-sub mt-1">{channelIntro}</p>
          </div>
        )}

        <div className={density === 'comfortable' ? 'space-y-0.5' : ''}>
          {messages.map((m) => (
            <MessageRow key={m.id} m={m} onOpenThread={openThread} onOpenProfile={openProfile} />
          ))}
        </div>

        {showTyping && (
          <div className="flex items-center gap-2 px-5 pt-3 text-[12.5px] text-sub dot-typing">
            <Avatar userId="sarah" size={22} presence={false} />
            <span>Sarah is typing<span>.</span><span>.</span><span>.</span></span>
          </div>
        )}
      </div>

      <Composer
        channelName={composerLabel}
        onSend={handleSend}
        editing={editing}
        setEditing={setEditing}
      />
    </>
  );
}

export default function ChannelView({
  active, workspaceId, channels, onToggleSidebar, openSearch, openCall, openThread, openProfile, openInfo, infoOpen,
}: ChannelViewProps) {
  const isDm = active.type === 'dm';
  const apiChannel = !isDm ? channels.find((channel) => channel.id === active.id) ?? null : null;
  const fallbackChannel = !isDm ? CHANNELS.find((channel) => channel.id === active.id) ?? null : null;
  const channelName = apiChannel?.name ?? fallbackChannel?.name ?? active.id;
  const channelDescription = apiChannel?.description?.trim() || fallbackChannel?.desc || 'No description yet.';
  const channelMemberCount = apiChannel?.memberCount ?? fallbackChannel?.members ?? 0;
  const channelIntro = channelDescription === 'No description yet.'
    ? 'This channel is ready for your team.'
    : `${channelDescription}${/[.!?]$/.test(channelDescription) ? '' : '.'} This is the very beginning of the channel.`;
  const channelMembersQuery = useQuery({
    queryKey: ['channel-members', workspaceId, apiChannel?.id],
    queryFn: () => channelsApi.listMembers(workspaceId, apiChannel!.id),
    enabled: !isDm && Boolean(apiChannel?.id),
    staleTime: 60_000,
  });
  const channelMembers = channelMembersQuery.data ?? [];
  const headerMembers = channelMembers.slice(0, 4);
  const headerMemberCount = channelMembers.length || channelMemberCount;
  const dmUser = isDm ? USERS[active.id] : null;
  const conversationKey = isDm
    ? `dm:${active.id}`
    : `channel:${apiChannel?.id ?? fallbackChannel?.id ?? active.id}`;
  const seedMessages = getSeedMessages({
    activeId: active.id,
    channelName,
    isDm,
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg">
      {/* Header */}
      <div className="h-14 border-b border-divider flex items-center px-4 gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden w-8 h-8 rounded-md text-sub hover:text-ink hover:bg-elevated flex items-center justify-center"
        >
          <Icon name="bars" size={18} />
        </button>

        {isDm ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar userId={active.id} size={28} />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-ink tracking-tightest truncate">
                {dmUser!.name}
              </div>
            </div>
            <Badge className="ml-1">
              {dmUser!.presence === 'online' ? 'Active' : dmUser!.presence === 'away' ? 'Away' : 'Offline'}
            </Badge>
          </div>
        ) : (
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-muted text-[16px]">#</span>
                <span className="text-[15px] font-semibold text-ink tracking-tightest truncate">
                  {channelName}
                </span>
                <Icon name="chevdown" size={14} className="text-sub" />
              </div>
            </div>
            <div className="h-5 w-px bg-divider mx-1 hidden sm:block" />
            <span className="text-[13px] text-sub truncate hidden sm:block max-w-[280px]">
              {channelDescription}
            </span>
          </div>
        )}

        <div className="ml-auto mr-2 flex items-center gap-2">
          {!isDm && (
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <div className="flex -space-x-2">
                {headerMembers.map((member) => (
                  <ChannelHeaderAvatar key={member.id} member={member} />
                ))}
              </div>
              <span className="text-[12px] text-sub">{headerMemberCount}</span>
            </div>
          )}

          <div className="w-px h-4 bg-divider hidden sm:block" />

          <Tooltip label="Channel info" side="bottom">
            <button
              onClick={openInfo}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition ${
                infoOpen ? 'bg-elevated text-ink' : 'text-sub hover:text-ink hover:bg-elevated'
              }`}
            >
              <Icon name="info" size={16} />
            </button>
          </Tooltip>

          <div className="w-px h-4 bg-divider" />

          <Tooltip label="Start call" side="bottom">
            <button
              onClick={openCall}
              className="w-8 h-8 rounded-md text-sub hover:text-ink hover:bg-elevated flex items-center justify-center transition"
            >
              <Icon name="phone" size={16} />
            </button>
          </Tooltip>
          <Tooltip label="Video call" side="bottom">
            <button
              onClick={openCall}
              className="w-8 h-8 rounded-md text-sub hover:text-ink hover:bg-elevated flex items-center justify-center transition"
            >
              <Icon name="video" size={16} />
            </button>
          </Tooltip>
          <Tooltip label="Search" keys={['⌘', 'K']} side="bottom">
            <button
              onClick={openSearch}
              className="w-8 h-8 rounded-md text-sub hover:text-ink hover:bg-elevated flex items-center justify-center transition"
            >
              <Icon name="search" size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      <ConversationPane
        key={conversationKey}
        channelIntro={channelIntro}
        channelName={channelName}
        composerLabel={isDm ? dmUser!.name : `#${channelName}`}
        isDm={isDm}
        openProfile={openProfile}
        openThread={openThread}
        seedMessages={seedMessages}
        showTyping={!isDm && channelName === 'engineering'}
      />
    </div>
  );
}
