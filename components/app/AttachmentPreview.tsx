'use client';

import Icon from '@/components/primitives/Icon';
import { getUploadFileUrl } from '@/lib/api/uploads';
import type { ChannelMessageAttachment } from '@/lib/api/types';

interface AttachmentPreviewProps {
  attachment: ChannelMessageAttachment;
  alt?: string;
  className?: string;
}

function getAttachmentKind(attachment: ChannelMessageAttachment) {
  const mime = attachment.contentType || attachment.mimeType || '';

  if (mime.startsWith('image/')) {
    return 'image';
  }

  if (mime === 'application/pdf') {
    return 'pdf';
  }

  return 'other';
}

export function isPreviewableAttachment(attachment: ChannelMessageAttachment) {
  return getAttachmentKind(attachment) !== 'other';
}

export default function AttachmentPreview({
  attachment,
  alt,
  className = '',
}: AttachmentPreviewProps) {
  const src = getUploadFileUrl(attachment.relativePath);
  const kind = getAttachmentKind(attachment);

  if (kind === 'image') {
    return (
      <div className={`relative overflow-hidden bg-panel ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? attachment.originalName}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <div className={`relative overflow-hidden bg-white ${className}`}>
        <iframe
          src={`${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          title={alt ?? attachment.originalName}
          className="h-full w-full pointer-events-none"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-[linear-gradient(180deg,transparent_0%,rgba(15,23,42,0.86)_100%)] px-2.5 py-2">
          <span className="rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90">
            PDF
          </span>
          <Icon name="folder" size={12} className="text-white/85" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-elevated text-sub ${className}`}>
      <Icon name="folder" size={16} />
    </div>
  );
}
