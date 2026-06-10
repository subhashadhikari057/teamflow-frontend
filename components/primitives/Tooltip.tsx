'use client';

import { useState } from 'react';

interface TooltipProps {
  label: string;
  keys?: string[];
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

const POSITIONS: Record<string, React.CSSProperties> = {
  top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
  bottom: { top: '100%',   left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
  right:  { left: '100%',  top: '50%',  transform: 'translateY(-50%)', marginLeft: 8 },
  left:   { right: '100%', top: '50%',  transform: 'translateY(-50%)', marginRight: 8 },
};

export default function Tooltip({ label, keys, side = 'top', children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-[120] whitespace-nowrap pointer-events-none anim-fade" style={POSITIONS[side]}>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-black border border-line text-xs text-ink shadow-lg">
            <span>{label}</span>
            {keys?.map((k, i) => <span key={i} className="kbd">{k}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
