import Icon from '@/components/primitives/Icon';

const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: 'zap',      title: 'Real-time Messaging', desc: 'Instant delivery, zero lag. Messages land the moment you hit send.' },
  { icon: 'thread',   title: 'Threaded Replies',    desc: 'Keep conversations organized without cluttering the main channel.' },
  { icon: 'folder',   title: 'File Sharing',        desc: 'Drag, drop, preview in seconds. Every file searchable forever.' },
  { icon: 'search',   title: 'Powerful Search',     desc: 'Find anything across all history — messages, files, people.' },
  { icon: 'video',    title: 'Voice & Video Calls', desc: 'Built-in calls, no third-party needed. Start one in a click.' },
  { icon: 'sliders',  title: 'Integrations',        desc: 'Connect your tools via webhooks & a clean, documented API.' },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1100px] px-6 py-24">
      <div className="text-[12px] uppercase tracking-[0.18em] text-muted font-medium mb-4">
        Features
      </div>
      <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tightest text-ink max-w-[620px] leading-[1.1]">
        Everything your team needs. Nothing they don&apos;t.
      </h2>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="lift rounded-md bg-panel border border-line p-6 hover:border-[#555555] group"
          >
            <div className="w-10 h-10 rounded-md bg-elevated border border-divider flex items-center justify-center mb-4 text-sub group-hover:text-ink transition-colors">
              <Icon name={f.icon} size={18} strokeWidth={1.5} />
            </div>
            <h3 className="text-[16px] font-semibold text-ink mb-2">{f.title}</h3>
            <p className="text-[14px] text-sub leading-[1.5]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
