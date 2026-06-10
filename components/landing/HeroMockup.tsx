import Icon from '@/components/primitives/Icon';
import Avatar from '@/components/primitives/Avatar';

const HERO_MSGS = [
  { u: 'sarah',  t: '9:02 AM', name: 'Sarah Chen',    b: 'kicking off the v2.4 release today 🚀' },
  { u: 'marcus', t: '9:14 AM', name: 'Marcus Wright',  b: 'staging deploy is green ✅' },
  { u: 'priya',  t: '9:21 AM', name: 'Priya Patel',    b: 'new thread panel looks 🔥' },
];

const SIDEBAR_CHANNELS = ['general', 'engineering', 'marketing', 'design', 'random'];

export default function HeroMockup() {
  return (
    <div
      className="rounded-lg border border-line bg-panel overflow-hidden"
      style={{ boxShadow: '0 0 0 1px #333, 0 40px 80px -20px rgba(0,0,0,0.9)' }}
    >
      {/* Browser chrome */}
      <div className="h-9 flex items-center gap-2 px-4 border-b border-divider bg-[#0a0a0a]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#333]" />
          <span className="w-3 h-3 rounded-full bg-[#333]" />
          <span className="w-3 h-3 rounded-full bg-[#333]" />
        </div>
        <div className="ml-3 flex-1 max-w-[260px] h-5 rounded bg-elevated border border-divider flex items-center px-2 gap-1.5">
          <Icon name="lock" size={10} className="text-muted" />
          <span className="text-[10px] text-muted font-mono">app.teamflow.io/engineering</span>
        </div>
      </div>

      <div className="flex h-[340px]">
        {/* Sidebar */}
        <div className="w-[180px] bg-sidebar border-r border-divider p-3 hidden sm:block">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center text-[11px] font-bold">
              N
            </div>
            <span className="text-[12px] font-semibold text-ink">Nomor</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted mb-2 px-1">Channels</div>
          {SIDEBAR_CHANNELS.map((c, i) => (
            <div
              key={c}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[12px] ${i === 1 ? 'bg-elevated text-ink' : 'text-sub'}`}
            >
              <span className="text-muted">#</span>{c}
              {i === 0 && (
                <span className="ml-auto text-[9px] bg-white text-black rounded px-1 font-bold">3</span>
              )}
            </div>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="h-10 border-b border-divider flex items-center px-4 gap-2">
            <span className="text-muted">#</span>
            <span className="text-[13px] font-semibold text-ink">engineering</span>
            <span className="text-[11px] text-muted ml-1">18 members</span>
          </div>
          <div className="flex-1 p-4 space-y-3.5 overflow-hidden">
            {HERO_MSGS.map((m, i) => (
              <div key={i} className="flex gap-2.5">
                <Avatar userId={m.u} size={26} presence={false} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-semibold text-ink">{m.name}</span>
                    <span className="text-[10px] text-muted">{m.t}</span>
                  </div>
                  <div className="text-[12.5px] text-[#d4d4d4]">{m.b}</div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 text-[11px] text-muted dot-typing pt-1">
              <Avatar userId="devon" size={20} presence={false} />
              <span>Devon is typing<span>.</span><span>.</span><span>.</span></span>
            </div>
          </div>
          <div className="m-3 h-9 rounded-md border border-line bg-elevated flex items-center px-3">
            <span className="text-[12px] text-muted">Message #engineering</span>
          </div>
        </div>
      </div>
    </div>
  );
}
