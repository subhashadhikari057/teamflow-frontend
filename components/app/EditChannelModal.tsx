'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { useCurrentUser } from '@/hooks/auth';
import { channelsApi } from '@/lib/api/channels';
import { getChannelErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/lib/toast-context';
import type { ChannelDetail, ChannelSummary } from '@/lib/api/types';
import { ConfirmDialog } from '@/components/app/settings/_shared';

interface EditChannelModalProps {
  workspaceId: string;
  channel: ChannelSummary;
  onClose: () => void;
  onDeleted: (nextChannelId: string | null) => void;
}

function normalizeChannelName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function EditChannelModal({
  workspaceId,
  channel,
  onClose,
  onDeleted,
}: EditChannelModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const me = useCurrentUser();
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? '');
  const [topic, setTopic] = useState(channel.topic ?? '');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const normalizedName = useMemo(() => normalizeChannelName(name), [name]);
  const trimmedDescription = description.trim();
  const trimmedTopic = topic.trim();
  const initialDescription = channel.description?.trim() ?? '';
  const initialTopic = channel.topic?.trim() ?? '';
  const isDirty = normalizedName !== channel.name
    || trimmedDescription !== initialDescription
    || trimmedTopic !== initialTopic;
  const currentWorkspaceRole = me?.currentWorkspace?.role;
  const canDeleteChannel = currentWorkspaceRole === 'OWNER' || currentWorkspaceRole === 'ADMIN';

  function updateCachedChannelLists(updater: (current: ChannelSummary[] | undefined) => ChannelSummary[] | undefined) {
    queryClient.setQueryData<ChannelSummary[] | undefined>(['channels', workspaceId], updater);
  }

  const updateChannel = useMutation({
    mutationFn: () => channelsApi.update(workspaceId, channel.id, {
      name: normalizedName,
      description: trimmedDescription,
      topic: trimmedTopic,
    }),
    onSuccess: (updatedChannel) => {
      queryClient.setQueryData<ChannelSummary[] | undefined>(
        ['channels', workspaceId],
        (current) => current?.map((item) => (item.id === updatedChannel.id ? { ...item, ...updatedChannel } : item)),
      );
      queryClient.setQueryData<ChannelDetail | ChannelSummary | undefined>(
        ['channel', workspaceId, channel.id],
        (current) => {
          if (!current) {
            return updatedChannel;
          }

          const members = 'members' in current && Array.isArray(current.members)
            ? current.members
            : undefined;

          return members
            ? { ...current, ...updatedChannel, members }
            : { ...current, ...updatedChannel };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ['channel', workspaceId, channel.id] });
      toast.success('Channel updated', `#${updatedChannel.name} details saved.`);
      onClose();
    },
    onError: (error) => {
      toast.error(getChannelErrorMessage(error));
    },
  });
  const deleteChannel = useMutation({
    mutationFn: () => channelsApi.delete(workspaceId, channel.id),
    onSuccess: () => {
      const currentChannels = queryClient.getQueryData<ChannelSummary[]>(['channels', workspaceId]) ?? [];
      const remainingChannels = currentChannels.filter((item) => item.id !== channel.id);
      const nextChannelId = remainingChannels.find((item) => item.isGeneral)?.id
        ?? remainingChannels[0]?.id
        ?? null;

      updateCachedChannelLists(() => remainingChannels);
      queryClient.removeQueries({ queryKey: ['channel', workspaceId, channel.id] });
      void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });

      setConfirmDeleteOpen(false);
      toast.success('Channel deleted', `#${channel.name} was deleted.`);
      onDeleted(nextChannelId);
    },
    onError: (error) => {
      toast.error(getChannelErrorMessage(error));
    },
  });
  const isBusy = updateChannel.isPending || deleteChannel.isPending;

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isBusy) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isBusy, onClose]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (channel.isGeneral) {
      toast.warning('The general channel cannot be edited.');
      onClose();
      return;
    }

    if (!normalizedName) {
      toast.warning('Enter a valid channel name.');
      return;
    }

    if (normalizedName.length < 2) {
      toast.warning('Channel name must be at least 2 characters.');
      return;
    }

    if (!isDirty) {
      toast.warning('No changes to save.');
      return;
    }

    updateChannel.mutate();
  }

  return (
    <div
        className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 anim-fade"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-line bg-panel shadow-2xl overflow-hidden anim-scale"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Edit channel</h2>
            <p className="text-[13px] text-sub mt-1">Update name, description, and topic.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="w-8 h-8 rounded-md text-muted hover:text-ink hover:bg-elevated transition disabled:opacity-40"
            aria-label="Close edit channel modal"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">Channel name</label>
            <div className="rounded-md border border-line bg-elevated focus-within:border-[#555555] focus-within:ring-2 focus-within:ring-white/20 transition">
              <div className="flex items-center gap-2 px-3 h-11">
                <span className="text-muted text-[15px]">#</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="design-reviews"
                  className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-muted outline-none"
                  maxLength={80}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <p className="text-[12px] text-sub">
                Saves as <span className="text-ink font-medium">#{normalizedName || 'channel-name'}</span>
              </p>
              <p className="text-[12px] text-muted">{name.length}/80</p>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What should people use this channel for?"
              className="w-full min-h-[108px] rounded-md border border-line bg-elevated px-3 py-2.5 text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition resize-none"
              maxLength={240}
            />
            <div className="flex justify-end mt-2">
              <p className="text-[12px] text-muted">{description.length}/240</p>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">Topic</label>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="What is this channel focused on right now?"
              className="w-full h-11 rounded-md border border-line bg-elevated px-3 text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition"
              maxLength={120}
            />
            <div className="flex justify-end mt-2">
              <p className="text-[12px] text-muted">{topic.length}/120</p>
            </div>
          </div>

        </div>

        {canDeleteChannel && !channel.isGeneral && (
          <div className="border-t border-divider px-6 py-4">
            <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] font-medium text-ink">Delete channel</div>
                <p className="text-[12px] text-sub mt-1 leading-relaxed">
                  Permanently remove this channel for everyone in the workspace.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isBusy}
                className="shrink-0 text-danger border-danger/30 hover:border-danger/50 hover:text-danger"
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-divider px-6 py-4 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={channel.isGeneral || isBusy || !isDirty || !normalizedName}
          >
            {updateChannel.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete channel"
        description={`Delete #${channel.name} for everyone in this workspace?`}
        warning="This will remove the channel and its current membership from the workspace."
        confirmLabel="Delete channel"
        isPending={deleteChannel.isPending}
        onConfirm={() => deleteChannel.mutate()}
        onClose={() => {
          if (!deleteChannel.isPending) {
            setConfirmDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}
