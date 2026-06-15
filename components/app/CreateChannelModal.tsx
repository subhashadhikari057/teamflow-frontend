'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { channelsApi } from '@/lib/api/channels';
import { getChannelErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/lib/toast-context';
import type { ChannelSummary, ChannelType } from '@/lib/api/types';

interface CreateChannelModalProps {
  workspaceId: string;
  onClose: () => void;
  onCreated: (channel: ChannelSummary) => void;
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

export default function CreateChannelModal({
  workspaceId,
  onClose,
  onCreated,
}: CreateChannelModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<ChannelType>('PUBLIC');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const normalizedName = useMemo(() => normalizeChannelName(name), [name]);

  const createChannel = useMutation({
    mutationFn: () => channelsApi.create(workspaceId, {
      name: normalizedName,
      description: description.trim() || undefined,
      topic: topic.trim() || undefined,
      type,
      isReadOnly,
    }),
    onSuccess: (channel) => {
      queryClient.setQueryData<ChannelSummary[] | undefined>(
        ['channels', workspaceId],
        (current) => current
          ? current.some((item) => item.id === channel.id)
            ? current
            : [...current, channel]
          : [channel],
      );
      void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
      toast.success('Channel created', `#${channel.name} is ready.`);
      onCreated(channel);
      onClose();
    },
    onError: (error) => {
      toast.error(getChannelErrorMessage(error));
    },
  });

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !createChannel.isPending) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [createChannel.isPending, onClose]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedName) {
      toast.warning('Enter a valid channel name.');
      return;
    }

    if (normalizedName.length < 2) {
      toast.warning('Channel name must be at least 2 characters.');
      return;
    }

    createChannel.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 anim-fade"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !createChannel.isPending) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl border border-line bg-panel shadow-2xl overflow-hidden anim-scale"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <div className="w-10 h-10 rounded-xl border border-line bg-elevated flex items-center justify-center mb-3 text-sub">
              <Icon name="hash" size={18} />
            </div>
            <h2 className="text-[17px] font-semibold text-ink">Create channel</h2>
            <p className="text-[13px] text-sub mt-1">
              Start a new space for focused conversation in this workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={createChannel.isPending}
            className="w-9 h-9 -mr-1 -mt-1 rounded-lg shrink-0 flex items-center justify-center text-muted hover:text-ink hover:bg-elevated transition disabled:opacity-40"
            aria-label="Close create channel modal"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">Channel type</label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-elevated p-1">
              {([
                {
                  value: 'PUBLIC' as const,
                  label: 'Public',
                  helper: 'Anyone in the workspace can find and join.',
                  icon: 'globe',
                },
                {
                  value: 'PRIVATE' as const,
                  label: 'Private',
                  helper: 'Only invited members can access it.',
                  icon: 'lock',
                },
              ]).map((option) => {
                const selected = type === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`rounded-md px-3 py-3 text-left transition ${
                      selected
                        ? 'bg-panel text-ink shadow-sm border border-line'
                        : 'text-sub hover:bg-panel/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[13px] font-medium">
                      <Icon name={option.icon} size={14} />
                      {option.label}
                    </div>
                    <p className="text-[11px] leading-relaxed mt-1.5">
                      {option.helper}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

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
                Preview: <span className="text-ink font-medium">#{normalizedName || 'channel-name'}</span>
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

          <label className="flex items-start gap-3 rounded-lg border border-line bg-elevated px-3.5 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isReadOnly}
              onChange={(event) => setIsReadOnly(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line bg-panel text-white"
            />
            <div>
              <div className="text-[13px] font-medium text-ink">Read-only channel</div>
              <p className="text-[12px] text-sub mt-1">
                Turn this on for announcements or updates where only selected people should post.
              </p>
            </div>
          </label>
        </div>

        <div className="border-t border-divider px-6 py-4 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createChannel.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createChannel.isPending}>
            {createChannel.isPending ? 'Creating…' : 'Create channel'}
          </Button>
        </div>
      </form>
    </div>
  );
}
