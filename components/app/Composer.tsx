'use client';

import { useState, useRef } from 'react';
import Icon from '@/components/primitives/Icon';
import Tooltip from '@/components/primitives/Tooltip';

interface EditingState {
  messageId?: string;
  body: string;
}

interface ComposerProps {
  channelName: string;
  disabled?: boolean;
  disabledMessage?: string;
  initialText?: string;
  onSend: (text: string) => void;
  onRequestEditLastMessage?: () => void;
  editing: EditingState | null;
  setEditing: (e: EditingState | null) => void;
}

const TOOLS = [
  { ic: 'bold',      label: 'Bold',   keys: ['Ctrl', 'B'] },
  { ic: 'italic',    label: 'Italic', keys: ['Ctrl', 'I'] },
  { ic: 'link',      label: 'Link' },
  { ic: 'smile',     label: 'Emoji' },
  { ic: 'at',        label: 'Mention' },
  { ic: 'paperclip', label: 'Attach', keys: ['Ctrl', 'U'] },
];

export default function Composer({
  channelName,
  disabled = false,
  disabledMessage,
  initialText = '',
  onSend,
  onRequestEditLastMessage,
  editing,
  setEditing,
}: ComposerProps) {
  const [text, setText] = useState(initialText);
  const ref = useRef<HTMLTextAreaElement>(null);
  const editingMessageId = editing?.messageId ?? null;

  const send = () => {
    if (disabled) return;
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
    setEditing(null);
    if (ref.current) { ref.current.style.height = 'auto'; }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === 'ArrowUp' && text === '' && !editing) {
      e.preventDefault();
      onRequestEditLastMessage?.();
    } else if (e.key === 'Escape' && editing) {
      setEditing(null);
      setText('');
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  return (
    <div className="px-5 pb-5 pt-1">
      {editingMessageId && (
        <div className="flex items-center gap-2 text-[12px] text-sub mb-2 px-1">
          <Icon name="compose" size={12} />
          Editing last message —{' '}
          <button
            onClick={() => { setEditing(null); setText(''); }}
            className="text-ink hover:underline"
          >
            cancel
          </button>{' '}
          <span className="text-muted">(Esc)</span>
        </div>
      )}

      <div
        className={`rounded-lg border bg-panel transition ${
          editing ? 'border-white/40' : 'border-line focus-within:border-[#555555]'
        }`}
      >
        <div className="flex items-center gap-0.5 px-2 pt-2">
          {TOOLS.map((t, i) => (
            <span key={t.ic}>
              <Tooltip label={t.label} keys={t.keys} side="top">
                <button className="w-7 h-7 rounded text-muted hover:text-ink hover:bg-elevated flex items-center justify-center transition">
                  <Icon name={t.ic} size={15} />
                </button>
              </Tooltip>
              {i === 1 && <div className="inline-block w-px h-4 bg-divider mx-1 align-middle" />}
            </span>
          ))}
        </div>

        <textarea
          autoFocus={Boolean(editingMessageId)}
          ref={ref}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => { setText(e.target.value); autoResize(e.target); }}
          onKeyDown={onKeyDown}
          placeholder={disabled ? (disabledMessage ?? `You can’t message ${channelName}`) : `Message ${channelName}`}
          className="w-full bg-transparent resize-none px-3 py-2.5 text-[15px] text-ink placeholder:text-muted outline-none leading-[1.5] disabled:cursor-not-allowed disabled:text-sub"
        />

        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[11px] text-muted pl-1">
            {disabled
              ? (disabledMessage ?? 'Messaging is disabled here.')
              : editingMessageId
                ? 'Enter to save · Esc to cancel'
                : 'Enter to send · Shift+Enter for newline'}
          </span>
          <button
            onClick={send}
            disabled={disabled || !text.trim()}
            className="lift w-8 h-8 rounded-md bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-[#e0e0e0] transition"
          >
            <Icon name="send" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
