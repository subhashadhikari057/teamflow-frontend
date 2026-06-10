import Link from 'next/link';
import Icon from '@/components/primitives/Icon';
import Button from '@/components/primitives/Button';
import HeroMockup from './HeroMockup';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-[1100px] px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated border border-line text-[13px] text-ink mb-8 anim-slide">
          <span className="text-ink">✦</span>
          <span>
            Now in public beta —{' '}
            <span className="text-sub">free for teams under 10</span>
          </span>
        </div>

        <h1
          className="text-[clamp(40px,7vw,68px)] font-bold tracking-tightest leading-[1.05] text-ink mx-auto max-w-[900px]"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          Where your team&apos;s work actually happens.
        </h1>

        <p className="mt-6 text-[20px] text-sub leading-[1.5] mx-auto max-w-[620px]">
          Channels, threads, calls, and search — built for teams that move fast.
        </p>

        <div className="mt-9 flex items-center justify-center gap-4">
          <Button size="lg">Start for Free</Button>
          <Link
            href="#"
            className="lift inline-flex items-center gap-1.5 h-11 px-2 text-[15px] text-ink hover:text-sub transition"
          >
            See it in action <Icon name="arrowright" size={16} />
          </Link>
        </div>

        <p className="mt-7 text-[13px] text-muted">Trusted by 4,000+ teams worldwide</p>
      </div>

      {/* Mockup */}
      <div className="relative mx-auto max-w-[1000px] px-6 pb-4">
        <div className="anim-fade">
          <HeroMockup />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
          style={{ background: 'linear-gradient(to bottom, transparent, #000)' }}
        />
      </div>
    </section>
  );
}
