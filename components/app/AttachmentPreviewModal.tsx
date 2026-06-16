'use client';

import { createPortal } from 'react-dom';
import Icon from '@/components/primitives/Icon';
import type { ChannelMessageAttachment } from '@/lib/api/types';
import AttachmentPreview from './AttachmentPreview';

interface AttachmentPreviewModalProps {
  attachment: ChannelMessageAttachment | null;
  metadata?: string;
  onClose: () => void;
}

export default function AttachmentPreviewModal({
  attachment,
  metadata,
  onClose,
}: AttachmentPreviewModalProps) {
  if (!attachment || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-divider px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium text-ink">
              {attachment.originalName}
            </div>
            {metadata && (
              <div className="text-[11px] text-muted">
                {metadata}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-elevated hover:text-ink"
            aria-label="Close preview"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="bg-[#0b0b0b] p-4">
          <AttachmentPreview
            attachment={attachment}
            alt={attachment.originalName}
            className="mx-auto h-[70vh] max-h-[780px] w-full max-w-3xl rounded-xl"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
