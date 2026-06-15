'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { useCurrentUser, useUpdateProfile } from '@/hooks/auth';
import { useToast } from '@/lib/toast-context';
import { STATUS_OPTIONS } from '@/lib/user-status';
import type { UserStatus } from '@/lib/api/types';

export default function SetStatusModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const [status, setStatus] = useState<UserStatus | ''>(user?.status ?? '');

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !updateProfile.isPending) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose, open, updateProfile.isPending]);

  if (!open) {
    return null;
  }

  async function save() {
    try {
      await updateProfile.mutateAsync({
        status: status || undefined,
      });
      toast.success('Status updated');
      onClose();
    } catch {
      toast.error('Failed to update status. Please try again.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 anim-fade"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !updateProfile.isPending) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-panel shadow-2xl overflow-hidden anim-scale"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <div className="w-9 h-9 rounded-xl border border-line bg-elevated flex items-center justify-center mb-3 text-sub">
              <Icon name="info" size={16} />
            </div>
            <h2 className="text-[16px] font-semibold text-ink">Set your status</h2>
            <p className="text-[12.5px] text-sub mt-1">
              Let your teammates know what mode you&apos;re in right now.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={updateProfile.isPending}
            className="w-8 h-8 rounded-md text-muted hover:text-ink hover:bg-elevated transition disabled:opacity-40"
            aria-label="Close status modal"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
                status === option.value
                  ? 'border-white/30 bg-elevated text-ink'
                  : 'border-line bg-panel text-sub hover:border-[#555555] hover:bg-elevated hover:text-ink'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: option.color }} />
              <span className="text-[13.5px] font-medium">{option.label}</span>
              {status === option.value && <Icon name="check" size={14} className="ml-auto text-ink" />}
            </button>
          ))}
          </div>
        </div>

        <div className="border-t border-divider px-5 py-4 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={updateProfile.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={updateProfile.isPending || status === (user?.status ?? '')}>
            {updateProfile.isPending ? 'Saving…' : 'Save status'}
          </Button>
        </div>
      </div>
    </div>
  );
}
