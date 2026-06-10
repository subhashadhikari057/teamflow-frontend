'use client';

import { useState } from 'react';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { Sect, FieldInput } from './_shared';

export default function GeneralTab() {
  const [wsName, setWsName] = useState('Nomor');
  const [saved,  setSaved]  = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">General</h2>
      <p className="text-[13px] text-sub mb-0">Workspace-wide settings.</p>

      <Sect title="Workspace identity">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl select-none shrink-0" style={{ letterSpacing: '-0.02em' }}>
              N
            </div>
            <div>
              <Button variant="secondary" size="sm">Change icon</Button>
              <p className="text-[12px] text-muted mt-1.5">SVG or PNG · 256 × 256 recommended</p>
            </div>
          </div>
          <FieldInput label="Workspace name" value={wsName} onChange={e => setWsName(e.target.value)} />
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Workspace URL</label>
            <div className="flex items-center h-10 rounded-md bg-elevated border border-divider overflow-hidden">
              <span className="pl-3 text-[14px] text-muted">teamflow.io/</span>
              <span className="text-[14px] text-sub pr-3">nomor</span>
            </div>
          </div>
        </div>
      </Sect>

      <Sect title="Region & language">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Language</label>
            <select className="w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink outline-none focus:border-[#555555] transition cursor-pointer appearance-none">
              <option>English (US)</option>
              <option>English (UK)</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Timezone</label>
            <select className="w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink outline-none focus:border-[#555555] transition cursor-pointer appearance-none">
              <option>NPT (UTC+5:45)</option>
              <option>PST (UTC−8)</option>
              <option>EST (UTC−5)</option>
              <option>GMT (UTC+0)</option>
              <option>IST (UTC+5:30)</option>
            </select>
          </div>
        </div>
      </Sect>

      <div className="pt-2 pb-10 flex items-center gap-3">
        <Button onClick={save}>
          {saved ? <><Icon name="check" size={15} /> Saved!</> : 'Save changes'}
        </Button>
        {saved && <span className="text-[13px] text-sub anim-fade">Changes saved.</span>}
      </div>

      <div className="rounded-lg border border-danger/40 p-6 space-y-4" style={{ background: 'rgba(239,68,68,0.04)' }}>
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Danger zone</h3>
          <p className="text-[13px] text-sub mt-0.5">Irreversible actions. Think twice.</p>
        </div>
        <div className="space-y-0 divide-y divide-danger/20">
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="text-[14px] text-ink">Leave workspace</div>
              <div className="text-[12px] text-sub mt-0.5">You will lose access to all channels and messages</div>
            </div>
            <Button variant="secondary" size="sm">Leave</Button>
          </div>
          <div className="flex items-center justify-between pt-4">
            <div>
              <div className="text-[14px] text-danger">Delete workspace</div>
              <div className="text-[12px] text-sub mt-0.5">Permanently deletes Nomor and all its data</div>
            </div>
            <Button variant="danger" size="sm">Delete workspace</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
