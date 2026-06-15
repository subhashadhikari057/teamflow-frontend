'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  label: string;
  keys?: string[];
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export default function Tooltip({ label, keys, side = 'top', children }: TooltipProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function show() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const GAP = 8;
    let top = 0, left = 0;

    if (side === 'bottom') {
      top  = r.bottom + GAP;
      left = r.left + r.width / 2;
    } else if (side === 'top') {
      top  = r.top - GAP;
      left = r.left + r.width / 2;
    } else if (side === 'left') {
      top  = r.top + r.height / 2;
      left = r.left - GAP;
    } else {
      top  = r.top + r.height / 2;
      left = r.right + GAP;
    }
    setCoords({ top, left });
  }

  function hide() { setCoords(null); }

  const transformMap: Record<string, string> = {
    bottom: 'translateX(-50%)',
    top:    'translateX(-50%) translateY(-100%)',
    left:   'translateX(-100%) translateY(-50%)',
    right:  'translateY(-50%)',
  };

  return (
    <div ref={ref} className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {coords && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[200] whitespace-nowrap pointer-events-none anim-fade"
          style={{ top: coords.top, left: coords.left, transform: transformMap[side] }}
        >
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#3a3a3a] bg-[#171717] text-xs text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <span>{label}</span>
            {keys?.map((k, i) => <span key={i} className="kbd">{k}</span>)}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
