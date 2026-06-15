'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCurrentUser } from '@/hooks/auth';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import Tooltip from '@/components/primitives/Tooltip';
import Badge from '@/components/primitives/Badge';
import Button from '@/components/primitives/Button';
import MessageBody from './MessageBody';
import Composer from './Composer';
import { CHANNELS, ENG_MESSAGES, USERS } from '@/lib/data';
import { authApi } from '@/lib/api/auth';
import { channelsApi } from '@/lib/api/channels';
import { getMessageErrorMessage } from '@/lib/api/errors';
import { messagesApi } from '@/lib/api/messages';
import { getUploadFileUrl } from '@/lib/api/uploads';
import { uploadImages } from '@/lib/api/uploads';
import { playMessageSound } from '@/lib/message-sound';
import { getStoredAccessToken, storeAccessToken } from '@/lib/auth-access-token';
import {
  type ChannelMetaUpdatedPayload,
  createMessagesSocket,
  type MessageCreatedPayload,
  type MessageDeletedPayload,
  type MessageUpdatedPayload,
  type TypingPayload,
} from '@/lib/realtime/messages-socket';
import { useToast } from '@/lib/toast-context';
import type {
  ChannelMemberSummary,
  ChannelMessage,
  ChannelSummary,
  SendChannelMessagePayload,
  WorkspaceRole,
} from '@/lib/api/types';
import type { Message } from '@/lib/types';
import { useAppearance } from '@/lib/appearance-context';
import { USER_PREFERENCE_SETTING_QUERY_KEY } from '@/lib/user-preference-setting';

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

interface UiMessage {
  id: string;
  userId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarUrl?: string | null;
  time: string;
  body: string;
  attachments: NonNullable<ChannelMessage['attachments']>;
  reactions: Message['reactions'];
  edited?: boolean;
  thread?: Message['thread'];
  createdAt?: string;
}

interface EditingState {
  messageId?: string;
  body: string;
}

const MESSAGE_PAGE_SIZE = 30;
type ChannelMessagesData = InfiniteData<ChannelMessage[], string | undefined>;

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function mapApiMessage(message: ChannelMessage): UiMessage {
  return {
    id: message.id,
    userId: message.senderId,
    senderName: message.sender.name,
    senderUsername: message.sender.username,
    senderAvatarUrl: message.sender.avatarUrl,
    time: formatMessageTime(message.createdAt),
    body: message.content,
    attachments: message.attachments ?? [],
    reactions: [],
    edited: message.isEdited,
    createdAt: message.createdAt,
  };
}

function upsertMessageInPages(
  current: ChannelMessagesData | undefined,
  message: ChannelMessage,
): ChannelMessagesData | undefined {
  if (!current) {
    return current;
  }

  const pages = current.pages.map((page) =>
    page.map((item) => (item.id === message.id ? message : item)),
  );
  const alreadyExists = pages.some((page) => page.some((item) => item.id === message.id));

  if (alreadyExists) {
    return { ...current, pages };
  }

  const nextPages = [...pages];
  const lastIndex = nextPages.length - 1;
  const lastPage = nextPages[lastIndex] ?? [];
  nextPages[lastIndex] = [...lastPage, message];

  return { ...current, pages: nextPages };
}

function mapMockMessage(message: Message): UiMessage {
  const fallbackUser = USERS[message.userId];

  return {
    id: message.id,
    userId: message.userId,
    senderName: fallbackUser?.name ?? message.userId,
    senderUsername: fallbackUser?.name?.toLowerCase().replace(/\s+/g, '.') ?? message.userId,
    senderAvatarUrl: null,
    time: message.time,
    body: message.body,
    attachments: [],
    reactions: message.reactions,
    thread: message.thread,
    edited: message.edited,
    createdAt: undefined,
  };
}

function getMessageToastDescription(message: ChannelMessage) {
  const content = message.content.trim();

  if (content) {
    return content.length > 120 ? `${content.slice(0, 117)}...` : content;
  }

  const attachments = message.attachments ?? [];

  if (attachments.length === 0) {
    return 'Sent a message';
  }

  const imageCount = attachments.filter((attachment) => {
    const mime = attachment.contentType || attachment.mimeType || '';
    return mime.startsWith('image/');
  }).length;

  if (imageCount === attachments.length) {
    return imageCount === 1 ? 'Sent an image' : `Sent ${imageCount} images`;
  }

  if (attachments.length === 1) {
    return `Sent ${attachments[0].originalName}`;
  }

  return `Sent ${attachments.length} attachments`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function isPrivilegedRole(role?: WorkspaceRole) {
  return role === 'OWNER' || role === 'ADMIN';
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

function MessageAvatar({
  name,
  userId,
  avatarUrl,
  size,
}: {
  name: string;
  userId: string;
  avatarUrl?: string | null;
  size: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getUploadFileUrl(avatarUrl)}
        alt={name}
        className="rounded-md object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  if (USERS[userId]) {
    return <Avatar userId={userId} size={size} presence={false} />;
  }

  return (
    <div
      className="rounded-md shrink-0 flex items-center justify-center font-semibold text-white select-none"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.35), background: '#3b82f6' }}
    >
      {getInitials(name)}
    </div>
  );
}

function MessageRow({
  m,
  currentUserId,
  onDelete,
  onEdit,
  onOpenThread,
  onOpenProfile,
}: {
  m: UiMessage;
  currentUserId?: string;
  onDelete: (messageId: string) => void;
  onEdit: (message: UiMessage) => void;
  onOpenThread: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const { density } = useAppearance();
  const isMine = currentUserId === m.userId;

  const isCozy = density === 'cozy';
  const isCompact = density === 'compact';
  const avatarSize = isCompact ? 30 : 36;
  const rowPy = isCozy ? 'py-[3px]' : isCompact ? 'py-1' : 'py-1.5';

  function formatAttachmentSize(size: number) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  const imageAttachments = m.attachments.filter((attachment) => {
    const mime = attachment.contentType || attachment.mimeType || '';
    return mime.startsWith('image/');
  });
  const fileAttachments = m.attachments.filter((attachment) => {
    const mime = attachment.contentType || attachment.mimeType || '';
    return !mime.startsWith('image/');
  });

  const attachments = m.attachments.length > 0 && (
    <div className="mt-2 flex flex-col gap-2">
      {imageAttachments.length > 0 && (
        <div className={`grid gap-2 ${imageAttachments.length === 1 ? 'grid-cols-1 max-w-[320px]' : 'grid-cols-2 max-w-[420px]'}`}>
          {imageAttachments.map((attachment) => (
            <a
              key={attachment.relativePath}
              href={getUploadFileUrl(attachment.relativePath)}
              target="_blank"
              rel="noreferrer"
              className="lift group relative block overflow-hidden rounded-xl border border-line bg-panel hover:border-[#555555] transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getUploadFileUrl(attachment.relativePath)}
                alt={attachment.originalName}
                className="block h-[180px] w-full object-cover transition duration-200 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.78)_100%)] px-3 py-2">
                <div className="truncate text-[12px] font-medium text-white">{attachment.originalName}</div>
                <div className="text-[11px] text-white/70">{formatAttachmentSize(attachment.size)}</div>
              </div>
            </a>
          ))}
        </div>
      )}
      {fileAttachments.map((attachment) => (
        <a
          key={attachment.relativePath}
          href={getUploadFileUrl(attachment.relativePath)}
          target="_blank"
          rel="noreferrer"
          className="lift flex max-w-[320px] items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2 hover:border-[#555555] hover:bg-elevated transition"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-divider bg-elevated text-sub">
            <Icon name="folder" size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-ink">{attachment.originalName}</div>
            <div className="text-[11px] text-muted">
              {attachment.contentType} · {formatAttachmentSize(attachment.size)}
            </div>
          </div>
          <Icon name="arrowright" size={13} className="shrink-0 text-muted" />
        </a>
      ))}
    </div>
  );

  const extras = (
    <>
      {attachments}
      {m.reactions.length > 0 && (
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
      <button
        onClick={() => onOpenThread(m.id)}
        className="w-8 h-8 flex items-center justify-center text-sub hover:text-ink hover:bg-elevated transition"
      >
        <Icon name="cornerreply" size={15} />
      </button>
      {isMine && (
        <>
          <button
            onClick={() => onEdit(m)}
            className="w-8 h-8 flex items-center justify-center text-sub hover:text-ink hover:bg-elevated transition border-l border-divider"
          >
            <Icon name="compose" size={14} />
          </button>
          <button
            onClick={() => onDelete(m.id)}
            className="w-8 h-8 flex items-center justify-center text-sub hover:text-danger hover:bg-elevated transition border-l border-divider"
          >
            <Icon name="x" size={14} />
          </button>
        </>
      )}
    </div>
  );

  if (isCozy) {
    return (
      <div
        data-message-id={m.id}
        className={`group relative flex items-baseline gap-2 px-5 ${rowPy} hover:bg-[#0c0c0c] transition rounded`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span className="text-[11px] text-muted w-14 text-right shrink-0 select-none">{m.time}</span>
        <button
          onClick={() => onOpenProfile(m.userId)}
          className="text-[13px] font-semibold text-ink hover:underline shrink-0"
        >
          {m.senderName}
        </button>
        <div className="min-w-0 flex-1" style={{ fontSize: 'var(--fs, 14px)' }}>
          <MessageBody body={m.body} />
          {extras}
        </div>
        {hoverActions}
      </div>
    );
  }

  return (
    <div
      data-message-id={m.id}
      className={`group relative flex gap-3 px-5 ${rowPy} hover:bg-[#0c0c0c] transition rounded`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button onClick={() => onOpenProfile(m.userId)} className="shrink-0 mt-0.5">
        <MessageAvatar
          userId={m.userId}
          name={m.senderName}
          avatarUrl={m.senderAvatarUrl}
          size={avatarSize}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <button
            onClick={() => onOpenProfile(m.userId)}
            className="font-semibold text-ink hover:underline"
            style={{ fontSize: 'var(--fs, 14px)' }}
          >
            {m.senderName}
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
  channelId,
  channelIntro,
  channelIsMember,
  channelName,
  channelLastReadAt,
  channelType,
  channelUnreadCount,
  joinedChannelIds,
  composerLabel,
  currentUserId,
  isDm,
  isReadOnly,
  isPrivileged,
  openProfile,
  openThread,
  seedMessages,
  workspaceId,
}: {
  channelId?: string;
  channelIntro: string;
  channelIsMember: boolean;
  channelName: string;
  channelLastReadAt?: string | null;
  channelType?: ChannelSummary['type'];
  channelUnreadCount: number;
  joinedChannelIds: string[];
  composerLabel: string;
  currentUserId?: string;
  isDm: boolean;
  isReadOnly: boolean;
  isPrivileged: boolean;
  openProfile: (userId: string) => void;
  openThread: (id: string) => void;
  seedMessages: Message[];
  workspaceId: string;
}) {
  const { density } = useAppearance();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [typers, setTypers] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof createMessagesSocket> | null>(null);
  const hasInitialPositionedRef = useRef(false);
  const previousMessageCountRef = useRef(0);
  const userPreferenceSettingQuery = useQuery({
    queryKey: USER_PREFERENCE_SETTING_QUERY_KEY,
    queryFn: authApi.getUserPreferenceSetting,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const channelMessagesQuery = useInfiniteQuery({
    queryKey: ['channel-messages', workspaceId, channelId],
    queryFn: ({ pageParam }) => messagesApi.list(workspaceId, channelId as string, {
      cursor: pageParam,
      limit: MESSAGE_PAGE_SIZE,
    }),
    enabled: !isDm && Boolean(channelId) && channelIsMember,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < MESSAGE_PAGE_SIZE) {
        return undefined;
      }

      return lastPage[0]?.id;
    },
    staleTime: 15_000,
  });
  const joinChannel = useMutation({
    mutationFn: () => channelsApi.join(workspaceId, channelId as string),
    onSuccess: () => {
      queryClient.setQueryData<ChannelSummary[] | undefined>(
        ['channels', workspaceId],
        (current) => current?.map((channel) => (
          channel.id === channelId ? { ...channel, isMember: true } : channel
        )),
      );
      void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ['channel-members', workspaceId, channelId] });
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', workspaceId, channelId] });
      toast.success('Joined channel', `You can now read and post in #${channelName}.`);
    },
    onError: (error) => {
      toast.error(getMessageErrorMessage(error));
    },
  });
  const sendMessage = useMutation({
    mutationFn: (payload: SendChannelMessagePayload) =>
      messagesApi.send(workspaceId, channelId as string, payload),
    onSuccess: (message) => {
      const now = new Date().toISOString();

      queryClient.setQueryData(
        ['channel-messages', workspaceId, channelId],
        (current: ChannelMessagesData | undefined) => upsertMessageInPages(current, message),
      );
      queryClient.setQueryData<ChannelSummary[] | undefined>(
        ['channels', workspaceId],
        (current) => current?.map((channel) => (
          channel.id === channelId
            ? {
              ...channel,
              unreadCount: 0,
              lastReadAt: now,
              lastMessageAt: message.createdAt,
              lastMessage: {
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                createdAt: message.createdAt,
              },
            }
            : channel
        )),
      );
    },
    onError: (error) => {
      toast.error(getMessageErrorMessage(error));
    },
  });
  const uploadAttachments = useMutation({
    mutationFn: (files: File[]) => uploadImages(files, false),
    onError: () => {
      toast.error('Failed to upload attachments. Please try again.');
    },
  });

  const updateMessage = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messagesApi.update(workspaceId, channelId as string, messageId, { content }),
    onSuccess: (message) => {
      queryClient.setQueryData(
        ['channel-messages', workspaceId, channelId],
        (current: ChannelMessagesData | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) =>
              page.map((item) => (item.id === message.id ? message : item)),
            ),
          };
        },
      );
      setEditing(null);
    },
    onError: (error) => {
      toast.error(getMessageErrorMessage(error));
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (messageId: string) => messagesApi.remove(workspaceId, channelId as string, messageId),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(
        ['channel-messages', workspaceId, channelId],
        (current: ChannelMessagesData | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) => page.filter((item) => item.id !== messageId)),
          };
        },
      );
      if (editing?.messageId === messageId) {
        setEditing(null);
      }
    },
    onError: (error) => {
      toast.error(getMessageErrorMessage(error));
    },
  });
  const markChannelRead = useMutation({
    mutationFn: () => channelsApi.markRead(workspaceId, channelId as string),
    onSuccess: () => {
      const now = new Date().toISOString();

      queryClient.setQueryData<ChannelSummary[] | undefined>(
        ['channels', workspaceId],
        (current) => current?.map((channel) => (
          channel.id === channelId
            ? { ...channel, unreadCount: 0, lastReadAt: now }
            : channel
        )),
      );
    },
  });

  const apiMessages = !isDm
    ? channelMessagesQuery.data?.pages.flatMap((page) => page).map(mapApiMessage) ?? []
    : [];
  const fallbackMessages = seedMessages.map(mapMockMessage);
  const messages = !isDm && channelMessagesQuery.data ? apiMessages : fallbackMessages;
  const canLoadOlder = !isDm && Boolean(channelMessagesQuery.hasNextPage);
  const isBusy = sendMessage.isPending || updateMessage.isPending || deleteMessage.isPending || uploadAttachments.isPending;
  const canJoinPublicChannel = !isDm && channelType === 'PUBLIC' && !channelIsMember;
  const composerHidden = canJoinPublicChannel || (!isDm && isReadOnly && !isPrivileged);
  const joinedChannelIdsKey = joinedChannelIds.join(',');
  const typingNames = Object.values(typers);
  const firstTypingUserId = Object.keys(typers)[0];

  useEffect(() => {
    hasInitialPositionedRef.current = false;
    previousMessageCountRef.current = 0;
  }, [channelId]);

  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) {
      return;
    }

    const container = scrollRef.current;
    const previousMessageCount = previousMessageCountRef.current;
    const nextMessageCount = messages.length;

    if (!hasInitialPositionedRef.current) {
      hasInitialPositionedRef.current = true;
      previousMessageCountRef.current = nextMessageCount;

      if (channelUnreadCount > 0 && channelLastReadAt) {
        const lastReadAtTime = new Date(channelLastReadAt).getTime();
        const firstUnreadMessage = messages.find((message) => {
          if (!message.createdAt) {
            return false;
          }

          const createdAtTime = new Date(message.createdAt).getTime();
          return !Number.isNaN(createdAtTime) && createdAtTime > lastReadAtTime;
        });

        if (firstUnreadMessage) {
          const unreadNode = container.querySelector<HTMLElement>(`[data-message-id="${firstUnreadMessage.id}"]`);

          if (unreadNode) {
            unreadNode.scrollIntoView({ block: 'center' });
            return;
          }
        }
      }

      container.scrollTop = container.scrollHeight;
      return;
    }

    previousMessageCountRef.current = nextMessageCount;

    if (channelMessagesQuery.isFetchingNextPage) {
      return;
    }

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    const newMessagesAppended = nextMessageCount > previousMessageCount;

    if (isNearBottom || newMessagesAppended) {
      container.scrollTop = container.scrollHeight;
    }
  }, [channelLastReadAt, channelMessagesQuery.isFetchingNextPage, channelUnreadCount, messages]);

  useEffect(() => {
    if (
      isDm
      || !channelId
      || channelUnreadCount <= 0
      || channelMessagesQuery.isLoading
      || channelMessagesQuery.isError
    ) {
      return;
    }

    void markChannelRead.mutateAsync();
  }, [channelId, channelMessagesQuery.isError, channelMessagesQuery.isLoading, channelUnreadCount, isDm, markChannelRead]);

  useEffect(() => {
    if (isDm || !channelId) {
      return;
    }

    let active = true;
    let socketCleanup: (() => void) | null = null;

    async function connectRealtime() {
      let token = getStoredAccessToken();

      if (!token) {
        try {
          const session = await authApi.refresh();
          token = session.tokens.accessToken;
          storeAccessToken(token);
        } catch {
          return;
        }
      }

      if (!active || !token) {
        return;
      }

      const socket = createMessagesSocket(token);
      socketRef.current = socket;

      const appendRealtimeMessage = (message: ChannelMessage) => {
        queryClient.setQueryData(
          ['channel-messages', workspaceId, channelId],
          (current: ChannelMessagesData | undefined) => upsertMessageInPages(current, message),
        );
      };

      const updateRealtimeMessage = (message: ChannelMessage) => {
        queryClient.setQueryData(
          ['channel-messages', workspaceId, channelId],
          (current: ChannelMessagesData | undefined) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              pages: current.pages.map((page) =>
                page.map((item) => (item.id === message.id ? message : item)),
              ),
            };
          },
        );
      };

      const removeRealtimeMessage = (messageId: string) => {
        queryClient.setQueryData(
          ['channel-messages', workspaceId, channelId],
          (current: ChannelMessagesData | undefined) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              pages: current.pages.map((page) => page.filter((item) => item.id !== messageId)),
            };
          },
        );
      };

      const updateChannelPreview = (message: ChannelMessage | null) => {
        const now = new Date().toISOString();

        queryClient.setQueryData<ChannelSummary[] | undefined>(
          ['channels', workspaceId],
          (current) => current?.map((channel) => (
            channel.id === channelId
              ? {
                ...channel,
                unreadCount: 0,
                lastReadAt: now,
                lastMessageAt: message?.createdAt ?? channel.lastMessageAt ?? null,
                lastMessage: message
                  ? {
                    id: message.id,
                    content: message.content,
                    senderId: message.senderId,
                    createdAt: message.createdAt,
                  }
                  : channel.lastMessage,
              }
              : channel
          )),
        );
      };

      const applyMessageToChannelMeta = (incomingChannelId: string, message: ChannelMessage) => {
        queryClient.setQueryData<ChannelSummary[] | undefined>(
          ['channels', workspaceId],
          (current) => current?.map((channel) => {
            if (channel.id !== incomingChannelId) {
              return channel;
            }

            const isActiveChannel = incomingChannelId === channelId;
            const isOwnMessage = message.senderId === currentUserId;

            return {
              ...channel,
              unreadCount: isActiveChannel || isOwnMessage
                ? 0
                : (channel.unreadCount ?? 0) + 1,
              lastReadAt: isActiveChannel || isOwnMessage
                ? new Date().toISOString()
                : channel.lastReadAt ?? null,
              lastMessageAt: message.createdAt,
              lastMessage: {
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                createdAt: message.createdAt,
              },
            };
          }),
        );
      };

      const updateChannelMeta = ({
        channelId: updatedChannelId,
        unreadCount,
        lastReadAt,
        lastMessageAt,
        lastMessage,
      }: ChannelMetaUpdatedPayload) => {
        queryClient.setQueryData<ChannelSummary[] | undefined>(
          ['channels', workspaceId],
          (current) => current?.map((channel) => (
            channel.id === updatedChannelId
              ? {
                ...channel,
                unreadCount,
                lastReadAt: lastReadAt ?? null,
                lastMessageAt: lastMessageAt ?? null,
                lastMessage: lastMessage ?? null,
              }
              : channel
          )),
        );
      };

      const handleCreated = ({ channelId: incomingChannelId, message }: MessageCreatedPayload) => {
        applyMessageToChannelMeta(incomingChannelId, message);

        const messageSoundEnabled = queryClient.getQueryData<{ messageSoundEnabled: boolean }>(
          USER_PREFERENCE_SETTING_QUERY_KEY,
        )?.messageSoundEnabled;

        if (message.senderId !== currentUserId && messageSoundEnabled === true) {
          void playMessageSound();
        }

        if (message.senderId !== currentUserId && incomingChannelId !== channelId) {
          const channelLabel = (
            queryClient.getQueryData<ChannelSummary[] | undefined>(['channels', workspaceId])
              ?.find((channel) => channel.id === incomingChannelId)
              ?.name
          ) ?? 'channel';

          toast.info(
            `${message.sender.name} in #${channelLabel}`,
            getMessageToastDescription(message),
            message.sender.avatarUrl ?? undefined,
          );
        }

        if (incomingChannelId !== channelId) {
          return;
        }

        appendRealtimeMessage(message);
        updateChannelPreview(message);
      };

      const handleUpdated = ({ channelId: incomingChannelId, message }: MessageUpdatedPayload) => {
        if (incomingChannelId !== channelId) {
          return;
        }

        updateRealtimeMessage(message);
        updateChannelPreview(message);
      };

      const handleDeleted = ({ channelId: incomingChannelId, messageId }: MessageDeletedPayload) => {
        if (incomingChannelId !== channelId) {
          return;
        }

        removeRealtimeMessage(messageId);
        void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
      };

      const handleChannelMetaUpdated = (payload: ChannelMetaUpdatedPayload) => {
        if (payload.workspaceId !== workspaceId) {
          return;
        }

        updateChannelMeta(payload);
      };

      const handleTypingStart = (payload: TypingPayload) => {
        if (
          payload.workspaceId !== workspaceId
          || payload.channelId !== channelId
          || payload.userId === currentUserId
        ) {
          return;
        }

        setTypers((current) => ({
          ...current,
          [payload.userId]: payload.username,
        }));
      };

      const handleTypingStop = (payload: TypingPayload) => {
        if (payload.workspaceId !== workspaceId || payload.channelId !== channelId) {
          return;
        }

        setTypers((current) => {
          if (!current[payload.userId]) {
            return current;
          }

          const next = { ...current };
          delete next[payload.userId];
          return next;
        });
      };

      socket.on('message.created', handleCreated);
      socket.on('message.updated', handleUpdated);
      socket.on('message.deleted', handleDeleted);
      socket.on('channel.meta.updated', handleChannelMetaUpdated);
      socket.on('typing.start', handleTypingStart);
      socket.on('typing.stop', handleTypingStop);

      joinedChannelIds.forEach((joinedChannelId) => {
        socket.emit('channel.join', {
          workspaceId,
          channelId: joinedChannelId,
        });
      });

      socketCleanup = () => {
        joinedChannelIds.forEach((joinedChannelId) => {
          socket.emit('channel.leave', {
            workspaceId,
            channelId: joinedChannelId,
          });
        });
        socket.off('message.created', handleCreated);
        socket.off('message.updated', handleUpdated);
        socket.off('message.deleted', handleDeleted);
        socket.off('channel.meta.updated', handleChannelMetaUpdated);
        socket.off('typing.start', handleTypingStart);
        socket.off('typing.stop', handleTypingStop);
        socket.disconnect();
        socketRef.current = null;
      };
    }

    void connectRealtime();

    return () => {
      active = false;
      socketCleanup?.();
      socketRef.current = null;
    };
  }, [channelId, currentUserId, isDm, joinedChannelIds, joinedChannelIdsKey, queryClient, toast, userPreferenceSettingQuery.data?.messageSoundEnabled, workspaceId]);

  async function handleSend({
    text,
    files,
  }: {
    text: string;
    files: File[];
  }) {
    if (isDm) {
      return;
    }

    if (editing?.messageId) {
      updateMessage.mutate({ messageId: editing.messageId, content: text });
      return;
    }

    try {
      const uploadedAttachments = files.length > 0
        ? (await uploadAttachments.mutateAsync(files)).items
        : [];

      sendMessage.mutate({
        content: text,
        attachments: uploadedAttachments,
      });
    } catch {
      return;
    }
  }

  function emitTypingStart() {
    if (isDm || !channelId || !socketRef.current) {
      return;
    }

    socketRef.current.emit('typing.start', {
      workspaceId,
      channelId,
    });
  }

  function emitTypingStop() {
    if (isDm || !channelId || !socketRef.current) {
      return;
    }

    socketRef.current.emit('typing.stop', {
      workspaceId,
      channelId,
    });
  }

  function requestEditLastMessage() {
    const lastOwnMessage = [...messages].reverse().find((message) => message.userId === currentUserId);

    if (!lastOwnMessage) {
      return;
    }

    setEditing({
      messageId: lastOwnMessage.id,
      body: lastOwnMessage.body,
    });
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {!isDm && (
          <div className="px-5 pb-4 mb-2">
            <div>
              <div className="w-12 h-12 rounded-lg bg-elevated border border-line flex items-center justify-center text-ink mb-3">
                <Icon name="hash" size={22} />
              </div>
              <h2 className="text-[22px] font-bold tracking-tightest text-ink">
                Welcome to #{channelName}
              </h2>
              <p className="text-[14px] text-sub mt-1">{channelIntro}</p>
            </div>
          </div>
        )}

        {canJoinPublicChannel && (
          <div className="px-5">
            <div className="max-w-[420px] rounded-xl border border-line bg-panel px-5 py-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-elevated border border-line flex items-center justify-center text-sub shrink-0">
                  <Icon name="globe" size={18} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-ink">Join #{channelName}</div>
                  <p className="text-[13px] text-sub mt-1">
                    This is a public channel. Join it to read the conversation and participate.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={() => joinChannel.mutate()} disabled={joinChannel.isPending}>
                  {joinChannel.isPending ? 'Joining…' : 'Join channel'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {!canJoinPublicChannel && !isDm && canLoadOlder && (
          <div className="px-5 pb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void channelMessagesQuery.fetchNextPage()}
              disabled={channelMessagesQuery.isFetchingNextPage}
            >
              {channelMessagesQuery.isFetchingNextPage ? 'Loading…' : 'Load older messages'}
            </Button>
          </div>
        )}

        {!canJoinPublicChannel && !isDm && channelMessagesQuery.isLoading && (
          <div className="px-5 py-10 text-[13px] text-sub">Loading messages…</div>
        )}

        {!canJoinPublicChannel && !isDm && channelMessagesQuery.isError && (
          <div className="px-5 py-10 flex items-center gap-3">
            <span className="text-[13px] text-sub">We couldn&apos;t load channel messages.</span>
            <Button variant="secondary" size="sm" onClick={() => void channelMessagesQuery.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!canJoinPublicChannel && (!isDm ? !channelMessagesQuery.isLoading && !channelMessagesQuery.isError : true) && (
          <div className={density === 'comfortable' ? 'space-y-0.5' : ''}>
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                m={m}
                currentUserId={currentUserId}
                onDelete={(messageId) => deleteMessage.mutate(messageId)}
                onEdit={(message) => setEditing({ messageId: message.id, body: message.body })}
                onOpenThread={openThread}
                onOpenProfile={openProfile}
              />
            ))}
          </div>
        )}

        {!canJoinPublicChannel && !isDm && !channelMessagesQuery.isLoading && !channelMessagesQuery.isError && messages.length === 0 && (
          <div className="px-5 py-10 text-[13px] text-sub">No messages yet. Start the conversation.</div>
        )}

        {!canJoinPublicChannel && typingNames.length > 0 && (
          <div className="flex items-center gap-2 px-5 pt-3 text-[12.5px] text-sub dot-typing">
            {firstTypingUserId && USERS[firstTypingUserId] ? (
              <Avatar userId={firstTypingUserId} size={22} presence={false} />
            ) : (
              <div className="w-[22px] h-[22px] rounded-md bg-elevated border border-line flex items-center justify-center text-muted shrink-0">
                <Icon name="compose" size={11} />
              </div>
            )}
            <span>
              {typingNames.length === 1
                ? `${typingNames[0]} is typing`
                : typingNames.length === 2
                  ? `${typingNames[0]} and ${typingNames[1]} are typing`
                  : `${typingNames.length} people are typing`}
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}
      </div>

      {!composerHidden && (
        <Composer
          key={`${channelId ?? 'dm'}:${editing?.messageId ?? 'new'}`}
          channelName={composerLabel}
          disabled={isBusy}
          initialText={editing?.body ?? ''}
          onSend={handleSend}
          onTypingStart={emitTypingStart}
          onTypingStop={emitTypingStop}
          onRequestEditLastMessage={requestEditLastMessage}
          editing={editing}
          setEditing={setEditing}
        />
      )}
    </>
  );
}

export default function ChannelView({
  active,
  workspaceId,
  channels,
  onToggleSidebar,
  openSearch,
  openCall,
  openThread,
  openProfile,
  openInfo,
  infoOpen,
}: ChannelViewProps) {
  const me = useCurrentUser();
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
    enabled: !isDm && Boolean(apiChannel?.id) && Boolean(apiChannel?.isMember),
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
  const realtimeChannelIds = useMemo(
    () => channels
      .filter((channel) => channel.isMember)
      .map((channel) => channel.id),
    [channels],
  );
  const isReadOnly = Boolean(apiChannel?.isReadOnly);
  const isPrivileged = isPrivilegedRole(me?.currentWorkspace?.role);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg">
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
        channelId={apiChannel?.id}
        channelIntro={channelIntro}
        channelIsMember={apiChannel?.isMember ?? true}
        channelName={channelName}
        channelLastReadAt={apiChannel?.lastReadAt ?? null}
        channelType={apiChannel?.type}
        channelUnreadCount={apiChannel?.unreadCount ?? 0}
        joinedChannelIds={realtimeChannelIds}
        composerLabel={isDm ? dmUser!.name : `#${channelName}`}
        currentUserId={me?.id}
        isDm={isDm}
        isReadOnly={isReadOnly}
        isPrivileged={isPrivileged}
        openProfile={openProfile}
        openThread={openThread}
        seedMessages={seedMessages}
        workspaceId={workspaceId}
      />
    </div>
  );
}
