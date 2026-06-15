'use client';

import Icon from '@/components/primitives/Icon';
import type { ChannelMessage } from '@/lib/api/types';

function summarizePinnedMessage(message: ChannelMessage) {
  const content = message.content.trim();

  if (content) {
    return content.length > 120 ? `${content.slice(0, 117)}...` : content;
  }

  const attachments = message.attachments ?? [];

  if (attachments.length === 0) {
    return 'Pinned message';
  }

  const imageCount = attachments.filter((attachment) => {
    const mime = attachment.contentType || attachment.mimeType || '';
    return mime.startsWith('image/');
  }).length;

  if (imageCount === attachments.length) {
    return imageCount === 1 ? '1 image' : `${imageCount} images`;
  }

  if (attachments.length === 1) {
    return attachments[0].originalName;
  }

  return `${attachments.length} attachments`;
}

interface PinnedMessageBannerProps {
  message: ChannelMessage | null;
  pinnedCount: number;
  onClick: () => void;
}

export default function PinnedMessageBanner({
  message,
  pinnedCount,
  onClick,
}: PinnedMessageBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-12 w-full items-center gap-3 border-b border-divider bg-[#181818] px-4 text-left transition hover:bg-[#1d1d1d]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center text-muted group-hover:text-ink">
        <Icon name="pin" size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-ink">
          {summarizePinnedMessage(message)}
        </div>
        <div className="truncate text-[11px] text-muted">
          {pinnedCount > 1
            ? `${pinnedCount} pinned messages`
            : message.pinnedBy?.name
              ? `Pinned by ${message.pinnedBy.name}`
              : 'Pinned message'}
        </div>
      </div>
      <div className="shrink-0 text-muted transition group-hover:text-ink">
        <Icon name="chevright" size={14} />
      </div>
    </button>
  );
}
