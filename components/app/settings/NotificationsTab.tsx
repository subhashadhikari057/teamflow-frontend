'use client';

import { useState } from 'react';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { Sect, ToggleRow } from './_shared';

export default function NotificationsTab() {
  const [notify,   setNotify]   = useState({ dms: true, mentions: true, threads: true, reactions: false });
  const [desktop,  setDesktop]  = useState({ enabled: true, sound: true, preview: true });
  const [email,    setEmail]    = useState({ digest: false, weekly: false });
  const [keyword,  setKeyword]  = useState('');
  const [keywords, setKeywords] = useState(['release', 'deploy', 'incident']);

  function addKeyword() {
    const k = keyword.trim();
    if (k && !keywords.includes(k)) setKeywords(prev => [...prev, k]);
    setKeyword('');
  }

  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tightest text-ink mb-1">Notifications</h2>
      <p className="text-[13px] text-sub mb-0">Choose when and how you want to be notified.</p>

      <Sect title="Notify me about">
        <ToggleRow label="Direct messages"  desc="Always notify for DMs, even when active"           on={notify.dms}       onToggle={() => setNotify(n => ({ ...n, dms: !n.dms }))} />
        <ToggleRow label="@mentions"        desc="When someone mentions you by name"                  on={notify.mentions}  onToggle={() => setNotify(n => ({ ...n, mentions: !n.mentions }))} />
        <ToggleRow label="Thread replies"   desc="Replies in threads you participated in"             on={notify.threads}   onToggle={() => setNotify(n => ({ ...n, threads: !n.threads }))} />
        <ToggleRow label="Reactions"        desc="When someone reacts to your message"                on={notify.reactions} onToggle={() => setNotify(n => ({ ...n, reactions: !n.reactions }))} />
      </Sect>

      <Sect title="Desktop" desc="Browser notifications while the app is in the background">
        <ToggleRow label="Enable desktop notifications" on={desktop.enabled}  onToggle={() => setDesktop(d => ({ ...d, enabled: !d.enabled }))} />
        <ToggleRow label="Play a sound"                 on={desktop.sound}    onToggle={() => setDesktop(d => ({ ...d, sound: !d.sound }))} />
        <ToggleRow label="Show message preview" desc="Include message content in the notification" on={desktop.preview} onToggle={() => setDesktop(d => ({ ...d, preview: !d.preview }))} />
      </Sect>

      <Sect title="Email" desc="Delivered to your inbox when you're away">
        <ToggleRow label="Daily digest"      desc="Summary of missed messages, once per day"         on={email.digest} onToggle={() => setEmail(e => ({ ...e, digest: !e.digest }))} />
        <ToggleRow label="Weekly highlights" desc="Top activity from your workspace each week"        on={email.weekly} onToggle={() => setEmail(e => ({ ...e, weekly: !e.weekly }))} />
      </Sect>

      <Sect title="Keywords" desc="Get notified any time these words appear in any channel">
        <div className="flex gap-2 mb-3">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKeyword()}
            placeholder="Add a keyword…"
            className="flex-1 h-9 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition"
          />
          <Button variant="secondary" size="sm" onClick={addKeyword}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map(k => (
            <span key={k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-elevated border border-line text-[13px] text-ink">
              {k}
              <button onClick={() => setKeywords(kws => kws.filter(x => x !== k))} className="text-muted hover:text-ink transition">
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
        </div>
      </Sect>
    </div>
  );
}
