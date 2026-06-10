'use client';

import { useEffect } from 'react';
import Avatar from '@/components/primitives/Avatar';
import Icon from '@/components/primitives/Icon';
import { USERS } from '@/lib/data';

interface CallState {
  open: boolean;
  muted: boolean;
  camOff: boolean;
  sharing: boolean;
}

interface CallOverlayProps {
  state: CallState;
  setState: (s: CallState) => void;
  onEnd: () => void;
}

function CallBtn({
  active, danger, highlight, onClick, icon, label,
}: {
  active?: boolean; danger?: boolean; highlight?: boolean;
  onClick: () => void; icon: string; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`lift relative w-12 h-12 rounded-full flex items-center justify-center border transition ${
        danger
          ? 'bg-elevated border-danger text-danger'
          : highlight
          ? 'bg-white border-white text-black'
          : 'bg-elevated border-line text-ink hover:border-[#555555]'
      }`}
    >
      <Icon name={icon} size={19} />
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted font-mono">
        {label}
      </span>
    </button>
  );
}

const PARTICIPANTS = ['ashim', 'sarah', 'marcus', 'priya'];

export default function CallOverlay({ state, setState, onEnd }: CallOverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'm') { e.preventDefault(); setState({ ...state, muted: !state.muted }); }
      if (k === 'v') { e.preventDefault(); setState({ ...state, camOff: !state.camOff }); }
      if (k === 's') { e.preventDefault(); setState({ ...state, sharing: !state.sharing }); }
      if (k === 'e') { e.preventDefault(); onEnd(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, setState, onEnd]);

  return (
    <div className="fixed inset-0 z-[110] bg-black anim-fade flex flex-col">
      <div className="h-14 flex items-center justify-between px-5 border-b border-divider">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span className="text-[14px] font-semibold text-ink">#engineering call</span>
          <span className="text-[12px] text-sub">· 4 participants · 12:04</span>
        </div>
        <span className="text-[12px] text-muted font-mono">M mute · V camera · S share · E end</span>
      </div>

      <div className="flex-1 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 place-content-center max-w-[1100px] mx-auto w-full">
        {PARTICIPANTS.map((id) => {
          const u = USERS[id];
          const isMe = id === 'ashim';
          const camOff = isMe && state.camOff;
          return (
            <div
              key={id}
              className="relative rounded-lg border border-line bg-panel overflow-hidden aspect-video flex items-center justify-center"
            >
              {camOff ? (
                <div className="flex flex-col items-center gap-2 text-muted">
                  <Icon name="videooff" size={26} />
                  <span className="text-[12px]">Camera off</span>
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-[30px] font-bold text-white"
                  style={{ background: u.color }}
                >
                  {u.initials}
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/70 border border-line backdrop-blur">
                <span className="text-[12px] font-medium text-ink">
                  {u.name}{isMe ? ' (you)' : ''}
                </span>
                {isMe && state.muted && <Icon name="micoff" size={13} className="text-danger" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pb-7 pt-3 flex items-center justify-center gap-3">
        <CallBtn
          active={!state.muted}
          danger={state.muted}
          onClick={() => setState({ ...state, muted: !state.muted })}
          icon={state.muted ? 'micoff' : 'mic'}
          label="M"
        />
        <CallBtn
          active={!state.camOff}
          danger={state.camOff}
          onClick={() => setState({ ...state, camOff: !state.camOff })}
          icon={state.camOff ? 'videooff' : 'video'}
          label="V"
        />
        <CallBtn
          active={state.sharing}
          highlight={state.sharing}
          onClick={() => setState({ ...state, sharing: !state.sharing })}
          icon="screen"
          label="S"
        />
        <button
          onClick={onEnd}
          className="lift h-12 px-6 rounded-full bg-danger text-white flex items-center gap-2 font-medium hover:bg-[#dc2626] transition"
        >
          <Icon name="phone" size={18} className="rotate-[135deg]" />
          End{' '}
          <span
            className="kbd ml-1"
            style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
          >
            E
          </span>
        </button>
      </div>
    </div>
  );
}
