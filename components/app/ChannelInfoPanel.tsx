'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import EditChannelModal from '@/components/app/EditChannelModal';
import { isPreviewableAttachment } from '@/components/app/AttachmentPreview';
import AttachmentPreviewModal from '@/components/app/AttachmentPreviewModal';
import { ConfirmDialog } from '@/components/app/settings/_shared';
import { CHANNELS, USERS } from '@/lib/data';
import { channelsApi } from '@/lib/api/channels';
import { getChannelErrorMessage, getMessageErrorMessage } from '@/lib/api/errors';
import { messagesApi } from '@/lib/api/messages';
import { getUploadFileUrl } from '@/lib/api/uploads';
import { workspacesApi } from '@/lib/api/workspaces';
import { useToast } from '@/lib/toast-context';
import type {
  ChannelDetail,
  ChannelMemberSummary,
  ChannelMessage,
  ChannelMessageAttachment,
  ChannelSummary,
  WorkspaceMemberSummary,
} from '@/lib/api/types';

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
  onChannelDeleted: (nextChannelId: string | null) => void;
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
        src={getUploadFileUrl(member.avatarUrl)}
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
  isLeaving,
  onEdit,
  onLeave,
}: {
  channel: ChannelSummary;
  creatorLabel: string;
  memberCount: number;
  isLeaving: boolean;
  onEdit: () => void;
  onLeave: () => void;
}) {
  const description = channel.description?.trim() || 'No description set';
  const topic = channel.topic?.trim() || 'No topic set';
  const privacyLabel = channel.type === 'PRIVATE' ? 'Private' : 'Public';
  const postingLabel = channel.isReadOnly ? 'Read only' : 'Open to members';
  const canEdit = !channel.isGeneral;
  const canLeave = channel.type === 'PUBLIC' && channel.isMember;

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

      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Description</div>
        <p className={`text-[13px] leading-[1.65] ${description === 'No description set' ? 'text-muted italic' : 'text-sub'}`}>
          {description}
        </p>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Topic</div>
        <p className={`text-[13px] ${topic === 'No topic set' ? 'text-muted italic' : 'text-sub'}`}>{topic}</p>
      </div>

      <div className="space-y-2.5">
        <MetaRow icon="users" label="Members" value={String(memberCount)} />
        <MetaRow icon={channel.type === 'PRIVATE' ? 'lock' : 'globe'} label="Privacy" value={privacyLabel} />
        <MetaRow icon="compose" label="Posting" value={postingLabel} />
        <MetaRow icon="hash" label="Created" value={formatChannelCreatedAt(channel.createdAt)} />
        <MetaRow icon="at" label="Created by" value={creatorLabel} />
      </div>

      {canLeave ? (
        <div className="pt-1">
          <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Access</div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onLeave}
            disabled={isLeaving}
          >
            {isLeaving ? 'Leaving…' : 'Leave channel'}
          </Button>
        </div>
      ) : (
        <div className="text-[13px] text-sub">You can&apos;t leave this channel.</div>
      )}
    </div>
  );
}

// ── Members tab ──────────────────────────────────────────────────────

function MembersTab({
  members,
  isLoading,
  isError,
  canAddMembers,
  eligibleMembers,
  isWorkspaceMembersLoading,
  isWorkspaceMembersError,
  addingUserId,
  onAddMember,
  onRetryWorkspaceMembers,
  onOpenProfile,
}: {
  members: ChannelMemberSummary[];
  isLoading: boolean;
  isError: boolean;
  canAddMembers: boolean;
  eligibleMembers: WorkspaceMemberSummary[];
  isWorkspaceMembersLoading: boolean;
  isWorkspaceMembersError: boolean;
  addingUserId: string | null;
  onAddMember: (userId: string) => void;
  onRetryWorkspaceMembers: () => void;
  onOpenProfile: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const filtered = members.filter((member) =>
    `${member.name ?? ''} ${member.username}`.toLowerCase().includes(query.toLowerCase())
  );
  const filteredEligibleMembers = eligibleMembers.filter((member) =>
    `${member.name} ${member.username}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-divider">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
          {canAddMembers && (
            <Button
              size="sm"
              variant={showAddPanel ? 'secondary' : 'primary'}
              onClick={() => setShowAddPanel((open) => !open)}
            >
              <Icon name="plus" size={13} />
              Add people
            </Button>
          )}
        </div>
        <div className="relative">
          <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a member…"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-elevated border border-line text-[13px] text-ink placeholder:text-muted outline-none focus:border-[#555555] transition"
          />
        </div>
        {canAddMembers && showAddPanel && (
          <div className="mt-3 rounded-md border border-line bg-panel overflow-hidden">
            <div className="px-3 py-2 border-b border-divider text-[12px] text-sub">
              Add workspace members to this private channel
            </div>
            {isWorkspaceMembersLoading ? (
              <div className="px-3 py-4 text-[12px] text-sub">Loading workspace members…</div>
            ) : isWorkspaceMembersError ? (
              <div className="px-3 py-4 flex items-center justify-between gap-3">
                <span className="text-[12px] text-sub">We couldn&apos;t load workspace members.</span>
                <Button variant="secondary" size="sm" onClick={onRetryWorkspaceMembers}>
                  Retry
                </Button>
              </div>
            ) : filteredEligibleMembers.length === 0 ? (
              <div className="px-3 py-4 text-[12px] text-sub">
                {eligibleMembers.length === 0 ? 'Everyone in the workspace is already in this channel.' : 'No workspace members match your search.'}
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto p-1.5">
                {filteredEligibleMembers.map((member) => {
                  const isAdding = addingUserId === member.userId;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => onAddMember(member.userId)}
                      disabled={Boolean(addingUserId)}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed transition text-left"
                    >
                      <div
                        className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center text-[12px] font-semibold text-white select-none"
                        style={{ background: '#3b82f6' }}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-ink truncate">{member.name}</div>
                        <div className="text-[11px] text-muted truncate">@{member.username}</div>
                      </div>
                      <span className="text-[11px] text-sub shrink-0">{isAdding ? 'Adding…' : 'Add'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
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

interface SharedFileItem {
  id: string;
  attachment: ChannelMessageAttachment;
  senderName: string;
  createdAt: string;
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getFileKindLabel(attachment: ChannelMessageAttachment) {
  const mime = attachment.contentType || attachment.mimeType || '';

  if (mime.startsWith('image/')) {
    return 'Image';
  }

  if (mime === 'application/pdf') {
    return 'PDF';
  }

  if (mime.includes('video')) {
    return 'Video';
  }

  if (mime.includes('audio')) {
    return 'Audio';
  }

  return 'File';
}

function FilesTab({
  files,
  isLoading,
  isError,
  onRetry,
}: {
  files: SharedFileItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [previewFile, setPreviewFile] = useState<SharedFileItem | null>(null);

  if (isLoading) {
    return <div className="px-4 py-10 text-center text-[13px] text-sub">Loading shared files…</div>;
  }

  if (isError) {
    return (
      <div className="px-4 py-10 text-center text-[13px] text-sub space-y-3">
        <div>We couldn&apos;t load shared files right now.</div>
        <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
      </div>
    );
  }

  if (files.length === 0) {
    return <Empty icon="folder" text="No files shared yet" />;
  }

  async function downloadFile(relativePath: string, originalName: string) {
    const url = getUploadFileUrl(relativePath);
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <>
      <div className="p-3">
        {files.map((file) => {
          const isPreviewable = isPreviewableAttachment(file.attachment);
          const content = (
            <>
              <div className="truncate text-[13px] text-ink">
                {file.attachment.originalName}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                <span className="min-w-0 truncate">
                  {getFileKindLabel(file.attachment)} · {formatFileSize(file.attachment.size)} · {file.senderName} · {formatFileDate(file.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void downloadFile(file.attachment.relativePath, file.attachment.originalName);
                  }}
                  className="shrink-0 cursor-pointer text-muted hover:text-ink transition"
                  aria-label={`Download ${file.attachment.originalName}`}
                  title="Download"
                >
                  <Icon name="download" size={12} />
                </button>
              </div>
            </>
          );

          if (isPreviewable) {
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setPreviewFile(file)}
                className="block w-full cursor-pointer border-b border-divider px-1 py-2 text-left last:border-b-0 hover:bg-elevated/40 transition"
              >
                {content}
              </button>
            );
          }

          return (
            <a
              key={file.id}
              href={getUploadFileUrl(file.attachment.relativePath)}
              target="_blank"
              rel="noreferrer"
              className="block border-b border-divider px-1 py-2 last:border-b-0 hover:bg-elevated/40 transition"
            >
              {content}
            </a>
          );
        })}
      </div>

      <AttachmentPreviewModal
        attachment={previewFile?.attachment ?? null}
        metadata={previewFile
          ? `${getFileKindLabel(previewFile.attachment)} · ${formatFileSize(previewFile.attachment.size)} · ${previewFile.senderName}`
          : undefined}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}

// ── Pinned tab ───────────────────────────────────────────────────────

function PinnedTab({
  items,
  isLoading,
  isError,
  isUnpinningMessageId,
  onOpenProfile,
  onRetry,
  onUnpin,
}: {
  items: ChannelMessage[];
  isLoading: boolean;
  isError: boolean;
  isUnpinningMessageId: string | null;
  onOpenProfile: (id: string) => void;
  onRetry: () => void;
  onUnpin: (messageId: string) => void;
}) {
  function formatPinnedAt(value?: string | null) {
    if (!value) {
      return 'Pinned';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Pinned';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  function getPinnedPreview(message: ChannelMessage) {
    const content = message.content.trim();

    if (content) {
      return content;
    }

    const attachments = message.attachments ?? [];

    if (attachments.length === 0) {
      return 'No preview available';
    }

    if (attachments.length === 1) {
      return attachments[0].originalName;
    }

    return `${attachments.length} attachments`;
  }

  if (isLoading) {
    return <div className="px-4 py-10 text-center text-[13px] text-sub">Loading pinned messages…</div>;
  }

  if (isError) {
    return (
      <div className="px-4 py-10 text-center text-[13px] text-sub space-y-3">
        <div>We couldn&apos;t load pinned messages right now.</div>
        <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <Empty icon="pin" text="No pinned messages" sub="Pin important messages so the team can find them fast." />;
  }

  return (
    <div className="p-3">
      {items.map((message) => (
        <div key={message.id} className="border-b border-divider px-1 py-2 last:border-b-0">
          <div className="line-clamp-3 text-[13px] text-ink">
            {getPinnedPreview(message)}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
            <button
              type="button"
              onClick={() => onOpenProfile(message.senderId)}
              className="truncate hover:underline"
            >
              {message.sender.name}
            </button>
            <span>•</span>
            <span className="truncate">{formatPinnedAt(message.pinnedAt)}</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => onUnpin(message.id)}
              disabled={isUnpinningMessageId === message.id}
              className="text-muted hover:text-ink transition disabled:opacity-40"
            >
              {isUnpinningMessageId === message.id ? 'Unpinning…' : 'Unpin'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
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

export default function ChannelInfoPanel({
  active,
  workspaceId,
  channels,
  onClose,
  onOpenProfile,
  onChannelDeleted,
}: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
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
  const creatorLabel = channelDetail?.creator?.name
    ?? (channelDetail?.creator?.username ? `@${channelDetail.creator.username}` : null)
    ?? creatorMember?.name
    ?? (creatorMember?.username ? `@${creatorMember.username}` : channel?.createdBy || 'Unknown');
  const channelMemberCount = channelMembers.length || channel?.memberCount || fallbackChannel?.members || 0;
  const dmUser  = isDm ? USERS[active.id] : null;
  const workspaceMembersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspacesApi.listMembers(workspaceId),
    enabled: !isDm && channel?.type === 'PRIVATE',
    staleTime: 60_000,
  });
  const eligibleWorkspaceMembers = useMemo(() => {
    const channelMemberUserIds = new Set(channelMembers.map((member) => member.userId));

    return (workspaceMembersQuery.data ?? []).filter((member) => !channelMemberUserIds.has(member.userId));
  }, [channelMembers, workspaceMembersQuery.data]);

  const tabs = isDm ? DM_TABS : CHANNEL_TABS;
  const [tab, setTab] = useState<string>(tabs[0]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const pinnedMessagesQuery = useQuery({
    queryKey: ['channel-pins', workspaceId, active.id],
    queryFn: () => messagesApi.listPins(workspaceId, active.id),
    enabled: !isDm && tab === 'Pinned',
    staleTime: 15_000,
  });
  const sharedFilesQuery = useQuery({
    queryKey: ['channel-files', workspaceId, active.id],
    queryFn: async () => {
      const collectedMessages: ChannelMessage[] = [];
      let cursor: string | undefined;
      let pagesLoaded = 0;

      while (pagesLoaded < 10) {
        const page = await messagesApi.list(workspaceId, active.id, {
          cursor,
          limit: 30,
        });

        collectedMessages.push(...page);
        pagesLoaded += 1;

        if (page.length < 30) {
          break;
        }

        cursor = page[0]?.id;

        if (!cursor) {
          break;
        }
      }

      return collectedMessages
        .flatMap((message) => (
          (message.attachments ?? []).map((attachment) => ({
            id: `${message.id}:${attachment.relativePath}`,
            attachment,
            senderName: message.sender.name,
            createdAt: message.createdAt,
          }))
        ))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    },
    enabled: !isDm && tab === 'Files',
    staleTime: 15_000,
  });
  const leaveChannel = useMutation({
    mutationFn: () => channelsApi.leave(workspaceId, active.id),
    onSuccess: () => {
      setConfirmLeaveOpen(false);
      queryClient.setQueryData<ChannelSummary[] | undefined>(
        ['channels', workspaceId],
        (current) => current?.map((item) => (
          item.id === active.id
            ? { ...item, isMember: false, unreadCount: 0, lastReadAt: null }
            : item
        )),
      );
      queryClient.removeQueries({ queryKey: ['channel-messages', workspaceId, active.id] });
      void queryClient.invalidateQueries({ queryKey: ['channel', workspaceId, active.id] });
      void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ['channel-members', workspaceId, active.id] });
      toast.success('Left channel', `You left #${channelName}.`);
    },
    onError: (error) => {
      toast.error(getChannelErrorMessage(error));
    },
  });
  const addChannelMember = useMutation({
    mutationFn: (userId: string) => channelsApi.addMember(workspaceId, active.id, { userId }),
    onSuccess: (addedMember) => {
      queryClient.setQueryData<ChannelDetail | ChannelSummary | undefined>(
        ['channel', workspaceId, active.id],
        (current) => {
          if (!current) {
            return current;
          }

          const existingMembers = 'members' in current && Array.isArray(current.members)
            ? current.members
            : [];

          const nextMembers = existingMembers.some((member) => member.userId === addedMember.userId)
            ? existingMembers
            : [...existingMembers, addedMember];

          return {
            ...current,
            memberCount: Math.max(current.memberCount ?? 0, nextMembers.length),
            members: nextMembers,
          };
        },
      );
      queryClient.setQueryData<ChannelSummary[] | undefined>(
        ['channels', workspaceId],
        (current) => current?.map((item) => (
          item.id === active.id
            ? { ...item, memberCount: Math.max(item.memberCount ?? 0, channelMemberCount + 1) }
            : item
        )),
      );
      void queryClient.invalidateQueries({ queryKey: ['channel', workspaceId, active.id] });
      void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
      toast.success('Member added to channel');
    },
    onError: (error) => {
      toast.error(getChannelErrorMessage(error));
    },
  });
  const unpinMessage = useMutation({
    mutationFn: (messageId: string) => messagesApi.unpin(workspaceId, active.id, messageId),
    onSuccess: (message) => {
      queryClient.setQueryData<ChannelMessage[] | undefined>(
        ['channel-pins', workspaceId, active.id],
        (current) => current?.filter((item) => item.id !== message.id) ?? [],
      );
      queryClient.setQueryData<ChannelSummary[] | undefined>(
        ['channels', workspaceId],
        (current) => current,
      );
      void queryClient.invalidateQueries({ queryKey: ['channel-pins', workspaceId, active.id] });
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', workspaceId, active.id] });
      toast.success('Message unpinned');
    },
    onError: (error) => {
      toast.error(getMessageErrorMessage(error));
    },
  });

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
                isLeaving={leaveChannel.isPending}
                onEdit={() => setEditModalOpen(true)}
                onLeave={() => setConfirmLeaveOpen(true)}
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
              canAddMembers={channel?.type === 'PRIVATE'}
              eligibleMembers={eligibleWorkspaceMembers}
              isWorkspaceMembersLoading={workspaceMembersQuery.isLoading}
              isWorkspaceMembersError={workspaceMembersQuery.isError}
              addingUserId={addChannelMember.isPending ? addChannelMember.variables ?? null : null}
              onAddMember={(userId) => addChannelMember.mutate(userId)}
              onRetryWorkspaceMembers={() => workspaceMembersQuery.refetch()}
              onOpenProfile={onOpenProfile}
            />
          )}
          {tab === 'Files'            && (
            <FilesTab
              files={sharedFilesQuery.data ?? []}
              isLoading={sharedFilesQuery.isLoading}
              isError={sharedFilesQuery.isError}
              onRetry={() => void sharedFilesQuery.refetch()}
            />
          )}
          {tab === 'Pinned'           && (
            <PinnedTab
              items={pinnedMessagesQuery.data ?? []}
              isLoading={pinnedMessagesQuery.isLoading}
              isError={pinnedMessagesQuery.isError}
              isUnpinningMessageId={unpinMessage.isPending ? unpinMessage.variables ?? null : null}
              onOpenProfile={onOpenProfile}
              onRetry={() => void pinnedMessagesQuery.refetch()}
              onUnpin={(messageId) => unpinMessage.mutate(messageId)}
            />
          )}
          {isDm  && tab === 'Profile' && <DmProfileTab userId={active.id} onOpenProfile={onOpenProfile} />}
        </div>
      </aside>

      {!isDm && editModalOpen && channel && !channel.isGeneral && (
        <EditChannelModal
          workspaceId={workspaceId}
          channel={channel}
          onClose={() => setEditModalOpen(false)}
          onDeleted={(nextChannelId) => {
            setEditModalOpen(false);
            onClose();
            onChannelDeleted(nextChannelId);
          }}
        />
      )}

      {!isDm && (
        <ConfirmDialog
          open={confirmLeaveOpen}
          title="Leave this channel?"
          description={`You will stop seeing #${channelName} in your sidebar unless you join it again.`}
          warning="This will continue immediately after you confirm."
          confirmLabel="Leave channel"
          icon="logout"
          tone="danger"
          isPending={leaveChannel.isPending}
          onConfirm={() => leaveChannel.mutate()}
          onClose={() => setConfirmLeaveOpen(false)}
        />
      )}
    </>
  );
}
