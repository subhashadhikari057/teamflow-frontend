'use client';

import { useEffect, useRef, useState } from 'react';
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
  onSend: (payload: { text: string; files: File[] }) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
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
  onTypingStart,
  onTypingStop,
  onRequestEditLastMessage,
  editing,
  setEditing,
}: ComposerProps) {
  const [text, setText] = useState(initialText);
  const [files, setFiles] = useState<File[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editingMessageId = editing?.messageId ?? null;
  const isTypingRef = useRef(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (disabled || !ref.current) {
      return;
    }

    ref.current.focus();
  }, [disabled, editingMessageId]);

  useEffect(() => {
    const hasText = text.trim().length > 0;

    if (disabled || !hasText) {
      if (isTypingRef.current) {
        onTypingStop?.();
        isTypingRef.current = false;
      }

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }

      return;
    }

    if (!isTypingRef.current) {
      onTypingStart?.();
      isTypingRef.current = true;
    }

    if (!typingIntervalRef.current) {
      typingIntervalRef.current = setInterval(() => {
        onTypingStart?.();
      }, 2500);
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [disabled, onTypingStart, onTypingStop, text]);

  useEffect(() => () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    if (isTypingRef.current) {
      onTypingStop?.();
      isTypingRef.current = false;
    }
  }, [onTypingStop]);

  const send = () => {
    if (disabled) return;
    const t = text.trim();
    if (!t && files.length === 0) return;
    if (isTypingRef.current) {
      onTypingStop?.();
      isTypingRef.current = false;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    onSend({ text: t, files });
    setText('');
    setFiles([]);
    setEditing(null);
    if (ref.current) {
      ref.current.style.height = 'auto';
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u' && !editing && !disabled) {
      e.preventDefault();
      fileInputRef.current?.click();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === 'ArrowUp' && text === '' && !editing) {
      e.preventDefault();
      onRequestEditLastMessage?.();
    } else if (e.key === 'Escape' && editing) {
      if (isTypingRef.current) {
        onTypingStop?.();
        isTypingRef.current = false;
      }
      setEditing(null);
      setText('');
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  function formatFileSize(size: number) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleFilesSelected(nextFiles: FileList | null) {
    if (!nextFiles || editing) {
      return;
    }

    const incoming = Array.from(nextFiles);

    setFiles((current) => {
      const byKey = new Map(current.map((file) => [`${file.name}:${file.size}:${file.lastModified}`, file]));

      incoming.forEach((file) => {
        byKey.set(`${file.name}:${file.size}:${file.lastModified}`, file);
      });

      return Array.from(byKey.values());
    });
  }

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
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.currentTarget.value = '';
          }}
          className="hidden"
        />
        <div className="flex items-center gap-0.5 px-2 pt-2">
          {TOOLS.map((t, i) => (
            <span key={t.ic}>
              <Tooltip label={t.label} keys={t.keys} side="top">
                <button
                  type="button"
                  onClick={t.ic === 'paperclip' ? () => fileInputRef.current?.click() : undefined}
                  disabled={disabled || Boolean(editing)}
                  className="w-7 h-7 rounded text-muted hover:text-ink hover:bg-elevated flex items-center justify-center transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Icon name={t.ic} size={15} />
                </button>
              </Tooltip>
              {i === 1 && <div className="inline-block w-px h-4 bg-divider mx-1 align-middle" />}
            </span>
          ))}
        </div>

        {files.length > 0 && (
          <div className="px-3 pt-2 flex flex-wrap gap-2">
            {files.map((file) => (
              <div
                key={`${file.name}:${file.size}:${file.lastModified}`}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-elevated px-2.5 py-1.5 max-w-full"
              >
                <Icon name="paperclip" size={12} className="text-sub shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] text-ink truncate max-w-[180px]">{file.name}</div>
                  <div className="text-[11px] text-muted">{formatFileSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                  className="text-muted hover:text-ink transition shrink-0"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          autoFocus={!disabled}
          ref={ref}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => { setText(e.target.value); autoResize(e.target); }}
          onFocus={() => {
            if (!disabled && text.trim() && !isTypingRef.current) {
              onTypingStart?.();
              isTypingRef.current = true;
            }
          }}
          onBlur={() => {
            if (isTypingRef.current) {
              onTypingStop?.();
              isTypingRef.current = false;
            }
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }
          }}
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
                : files.length > 0
                  ? 'Enter to send · Shift+Enter for newline · Files will upload first'
                  : 'Enter to send · Shift+Enter for newline'}
          </span>
          <button
            onClick={send}
            disabled={disabled || (!text.trim() && files.length === 0)}
            className="lift w-8 h-8 rounded-md bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-[#e0e0e0] transition"
          >
            <Icon name="send" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
