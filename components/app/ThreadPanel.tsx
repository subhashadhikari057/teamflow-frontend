'use client';

import { useState } from 'react';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import MessageBody from './MessageBody';
import { ENG_MESSAGES, USERS } from '@/lib/data';
import type { ThreadReply } from '@/lib/types';

interface ThreadPanelProps {
  messageId: string;
  onClose: () => void;
  onOpenProfile: (userId: string) => void;
}

export default function ThreadPanel({ messageId, onClose, onOpenProfile }: ThreadPanelProps) {
  const parent = ENG_MESSAGES.find((m) => m.id === messageId) ?? ENG_MESSAGES.find((m) => m.thread);
  const [replies, setReplies] = useState<ThreadReply[]>(parent?.thread?.replies ?? []);
  const [text, setText] = useState('');

  if (!parent) return null;
  const u = USERS[parent.userId];

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const id = `tr-${replies.length}`;
    setReplies((p) => [...p, { id, userId: 'ashim', time: 'now', body: t }]);
    setText('');
  };

  return (
    <aside className="w-[340px] shrink-0 border-l border-divider bg-bg flex flex-col anim-slide">
      {/* Header */}
      <div className="h-14 border-b border-divider flex items-center justify-between px-4 shrink-0">
        <div>
          <div className="text-[15px] font-semibold text-ink tracking-tightest">Thread</div>
          <div className="text-[12px] text-sub">#engineering</div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-md text-sub hover:text-ink hover:bg-elevated flex items-center justify-center transition"
        >
          <Icon name="x" size={17} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Parent message */}
        <div className="px-4 py-3 flex gap-3">
          <Avatar userId={parent.userId} size={36} presence={false} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] font-semibold text-ink">{u.name}</span>
              <span className="text-[11px] text-muted">{parent.time}</span>
            </div>
            <div className="mt-0.5">
              <MessageBody body={parent.body} />
            </div>
          </div>
        </div>

        {/* Reply count divider */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="h-px bg-divider flex-1" />
          <span className="text-[12px] text-sub">{replies.length} replies</span>
          <div className="h-px bg-divider flex-1" />
        </div>

        {/* Replies */}
        <div className="space-y-0.5 pb-2">
          {replies.map((r) => {
            const ru = USERS[r.userId];
            return (
              <div
                key={r.id}
                className="px-4 py-1.5 flex gap-3 hover:bg-[#0c0c0c] transition"
              >
                <button onClick={() => onOpenProfile(r.userId)}>
                  <Avatar userId={r.userId} size={32} presence={false} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13.5px] font-semibold text-ink">{ru.name}</span>
                    <span className="text-[11px] text-muted">{r.time}</span>
                  </div>
                  <div className="mt-0.5">
                    <MessageBody body={r.body} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply input */}
      <div className="p-3 border-t border-divider shrink-0">
        <div className="rounded-lg border border-line bg-panel focus-within:border-[#555555] transition flex items-end">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Reply…"
            className="flex-1 bg-transparent resize-none px-3 py-2.5 text-[14px] text-ink placeholder:text-muted outline-none"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="lift m-1.5 w-8 h-8 rounded-md bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-[#e0e0e0] transition"
          >
            <Icon name="send" size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
