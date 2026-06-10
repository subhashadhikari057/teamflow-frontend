'use client';

import { useState } from 'react';
import { Sect, ToggleRow } from './_shared';
import { useAppearance } from '@/lib/appearance-context';

export default function AppearanceTab() {
  const { density, fontSize, setDensity, setFontSize } = useAppearance();
  const [linkPreview, setLinkPreview] = useState(true);
  const [animations,  setAnimations]  = useState(true);

  const densities = [
    {
      id: 'comfortable' as const, label: 'Comfortable', desc: 'More space between messages',
      preview: (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded bg-elevated shrink-0" />
              <div className="space-y-1.5 pt-0.5">
                <div className="h-2 w-14 rounded bg-elevated" />
                <div className="h-2 w-24 rounded bg-divider" />
                <div className="h-2 w-20 rounded bg-divider" />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'compact' as const, label: 'Compact', desc: 'Tighter spacing, see more messages',
      preview: (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-1.5">
              <div className="w-4 h-4 rounded bg-elevated shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="h-1.5 w-12 rounded bg-elevated" />
                <div className="h-1.5 w-20 rounded bg-divider" />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'cozy' as const, label: 'Cozy', desc: 'Condensed, no avatars shown',
      preview: (
        <div className="space-y-1.5">
          {['9:02 · Sarah', '9:14 · Marcus', '9:21 · Priya', '9:38 · Devon'].map(n => (
            <div key={n} className="flex gap-2 items-center">
              <div className="h-1.5 w-10 rounded bg-muted shrink-0" />
              <div className="h-1.5 w-20 rounded bg-divider" />
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Appearance</h2>
      <p className="text-[13px] text-sub mb-0">Customize how Teamflow looks for you.</p>

      <Sect title="Theme">
        <div className="flex items-center justify-between p-4 rounded-lg bg-panel border border-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-black border border-line flex items-center justify-center text-white font-bold">◐</div>
            <div>
              <div className="text-[14px] font-medium text-ink">Dark</div>
              <div className="text-[12px] text-sub">Currently active theme</div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-sub border border-line px-2.5 py-0.5 rounded-full">Active</span>
        </div>
      </Sect>

      <Sect title="Message density" desc="How much breathing room between messages in the feed">
        <div className="grid grid-cols-3 gap-3">
          {densities.map(d => (
            <button
              key={d.id}
              onClick={() => setDensity(d.id)}
              className={`rounded-lg border p-4 text-left transition-all ${density === d.id ? 'border-white bg-elevated' : 'border-line hover:border-[#555555]'}`}
            >
              <div className="mb-3 h-16 overflow-hidden">{d.preview}</div>
              <div className="text-[13px] font-medium text-ink">{d.label}</div>
              <div className="text-[11px] text-muted mt-0.5 leading-snug">{d.desc}</div>
            </button>
          ))}
        </div>
      </Sect>

      <Sect title="Font size">
        <div className="flex gap-3">
          {([['small', 'Small', '13px'], ['default', 'Default', '15px'], ['large', 'Large', '17px']] as const).map(([id, label, size]) => (
            <button
              key={id}
              onClick={() => setFontSize(id)}
              className={`flex-1 rounded-lg border p-4 text-center transition ${fontSize === id ? 'border-white bg-elevated' : 'border-line hover:border-[#555555]'}`}
            >
              <div className="text-ink mb-1.5" style={{ fontSize }}>Aa</div>
              <div className="text-[12px] text-sub">{label}</div>
            </button>
          ))}
        </div>
      </Sect>

      <Sect title="Other">
        <ToggleRow label="Link previews" desc="Show inline previews for URLs pasted in messages" on={linkPreview} onToggle={() => setLinkPreview(v => !v)} />
        <ToggleRow label="Animations"    desc="Motion effects and transitions throughout the app" on={animations}  onToggle={() => setAnimations(v => !v)} />
      </Sect>
    </div>
  );
}
