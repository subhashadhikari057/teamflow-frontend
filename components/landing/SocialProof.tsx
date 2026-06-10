const LOGOS = ['Northwind', 'Loop', 'Brightside', 'Vector', 'Monolith', 'Cadence'];

const TESTIMONIALS = [
  {
    quote: "We moved our whole eng org over in a weekend. The search alone paid for itself in the first week.",
    name: 'Sarah Chen', role: 'VP Engineering', company: 'Northwind', color: '#10b981', initials: 'SC',
  },
  {
    quote: "Threads finally stay readable. Our async culture runs entirely on Teamflow now.",
    name: 'Marcus Wright', role: 'Head of Product', company: 'Loop', color: '#f59e0b', initials: 'MW',
  },
  {
    quote: "Calls, files, and channels in one place — we cancelled three other subscriptions.",
    name: 'Priya Patel', role: 'COO', company: 'Brightside', color: '#ec4899', initials: 'PP',
  },
];

export default function SocialProof() {
  return (
    <section className="border-y border-divider bg-[#050505]">
      <div className="py-20">
        <p className="text-center text-[13px] text-muted mb-10">Loved by teams at</p>

        {/* Marquee */}
        <div className="mx-auto max-w-[1100px] px-6">
        <div className="relative overflow-hidden mb-16">
          {/* Fade masks */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10"
            style={{ background: 'linear-gradient(to right, #050505, transparent)' }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10"
            style={{ background: 'linear-gradient(to left, #050505, transparent)' }}
          />

          <div className="flex gap-20 w-max animate-marquee">
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <span
                key={i}
                className="text-[28px] font-semibold tracking-tightest text-muted whitespace-nowrap select-none"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        </div>

        {/* Testimonials */}
        <div className="mx-auto max-w-[1100px] px-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-md bg-panel border border-line p-4 flex flex-col">
              <p className="text-[13px] text-[#d4d4d4] leading-[1.55] flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                  style={{ background: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-ink">{t.name}</div>
                  <div className="text-[11px] text-sub">{t.role}, {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
