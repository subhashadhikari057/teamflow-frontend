import PageNav from '@/components/layout/PageNav';
import Footer from '@/components/landing/Footer';
import Icon from '@/components/primitives/Icon';
import { CHANGELOG } from '@/lib/changelog';

const TAG_STYLES = {
  major: 'bg-white text-black',
  minor: 'bg-elevated border border-line text-ink',
  patch: 'bg-elevated border border-line text-muted',
};

const TYPE_STYLES = {
  new:      { label: 'New',      color: 'text-emerald-400', dot: 'bg-emerald-400' },
  improved: { label: 'Improved', color: 'text-sky-400',     dot: 'bg-sky-400' },
  fixed:    { label: 'Fixed',    color: 'text-amber-400',   dot: 'bg-amber-400' },
  infra:    { label: 'Infra',    color: 'text-muted',       dot: 'bg-muted' },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PageNav />

      <main className="mx-auto max-w-[800px] px-6 py-20">
        {/* Header */}
        <div className="mb-16">
          <div className="text-[12px] uppercase tracking-[0.18em] text-muted font-medium mb-4">Changelog</div>
          <h1 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tightest text-ink leading-[1.05]">
            What&apos;s new
          </h1>
          <p className="mt-4 text-[18px] text-sub">
            Every release, documented. Subscribe via{' '}
            <a href="#" className="text-ink hover:underline">RSS</a>.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-0 w-px bg-divider" />

          <div className="space-y-14">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-bg bg-line" />

                {/* Version header */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-md ${TAG_STYLES[entry.tag]}`}>
                    v{entry.version}
                  </span>
                  <span className="text-[13px] text-muted">{entry.date}</span>
                  {entry.tag === 'major' && (
                    <span className="text-[11px] px-2 py-0.5 rounded border border-white/20 text-sub">
                      Major release
                    </span>
                  )}
                </div>

                <p className="text-[15px] text-sub mb-6 leading-[1.5]">{entry.summary}</p>

                {/* Change groups */}
                <div className="space-y-5">
                  {entry.changes.map((group) => {
                    const style = TYPE_STYLES[group.type];
                    return (
                      <div key={group.type}>
                        <div className={`flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider mb-2.5 ${style.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {style.label}
                        </div>
                        <ul className="space-y-2">
                          {group.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#c8c8c8] leading-[1.55]">
                              <Icon name="chevright" size={14} className="text-muted shrink-0 mt-0.5" strokeWidth={2} />
                              <span dangerouslySetInnerHTML={{
                                __html: item.replace(/`([^`]+)`/g,
                                  '<code class="font-mono text-[12.5px] px-1.5 py-0.5 rounded bg-elevated border border-line text-[#e5e5e5]">$1</code>'
                                )
                              }} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
