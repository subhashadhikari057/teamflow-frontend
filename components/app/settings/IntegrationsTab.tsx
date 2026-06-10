'use client';

import { useState } from 'react';
import Button from '@/components/primitives/Button';

const INTEGRATIONS = [
  { id: 'github',  name: 'GitHub',       desc: 'Link PRs and issues directly in messages',    bg: '#24292e', letter: 'G', fgDark: false, defaultOn: true,  account: 'subhash-adhikari' },
  { id: 'figma',   name: 'Figma',        desc: 'Unfurl Figma links with live frame previews', bg: '#f24e1e', letter: 'F', fgDark: false, defaultOn: true,  account: 'Subhash' },
  { id: 'linear',  name: 'Linear',       desc: 'Show issue status without leaving Teamflow',  bg: '#5e6ad2', letter: 'L', fgDark: false, defaultOn: false, account: '' },
  { id: 'notion',  name: 'Notion',       desc: 'Preview Notion pages inline in chat',         bg: '#f5f5f5', letter: 'N', fgDark: true,  defaultOn: false, account: '' },
  { id: 'zapier',  name: 'Zapier',       desc: 'Automate workflows between your tools',       bg: '#ff4a00', letter: 'Z', fgDark: false, defaultOn: false, account: '' },
  { id: 'gdrive',  name: 'Google Drive', desc: 'Attach and preview Drive files in messages',  bg: '#4285f4', letter: 'D', fgDark: false, defaultOn: false, account: '' },
];

export default function IntegrationsTab() {
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATIONS.map(i => [i.id, i.defaultOn]))
  );

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Integrations</h2>
      <p className="text-[13px] text-sub mb-6">Connect Teamflow to your other tools.</p>

      <div className="space-y-2">
        {INTEGRATIONS.map(intg => (
          <div key={intg.id} className="flex items-center gap-4 rounded-lg border border-line bg-panel p-4 hover:border-[#444] transition">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[15px] shrink-0 select-none border border-white/10"
              style={{ background: intg.bg, color: intg.fgDark ? '#111' : '#fff' }}
            >
              {intg.letter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-medium text-ink">{intg.name}</span>
                {connected[intg.id] && (
                  <span className="text-[11px] px-1.5 py-px rounded-full border" style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)' }}>
                    Connected
                  </span>
                )}
              </div>
              <div className="text-[13px] text-sub mt-0.5 truncate">{intg.desc}</div>
              {connected[intg.id] && intg.account && (
                <div className="text-[12px] text-muted mt-0.5">as <span className="text-sub">{intg.account}</span></div>
              )}
            </div>
            <Button
              variant={connected[intg.id] ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setConnected(c => ({ ...c, [intg.id]: !c[intg.id] }))}
            >
              {connected[intg.id] ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-line p-5 text-center">
        <p className="text-[13px] text-sub">
          Building something? Use the{' '}
          <span className="text-ink cursor-pointer hover:underline">REST API</span>
          {' '}or{' '}
          <span className="text-ink cursor-pointer hover:underline">webhooks</span>
          {' '}to connect any tool.
        </p>
      </div>
    </div>
  );
}
