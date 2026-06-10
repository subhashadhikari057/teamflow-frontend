'use client';

import { useState } from 'react';
import Icon from '@/components/primitives/Icon';

const FAQS = [
  {
    q: 'How is Teamflow different from other chat tools?',
    a: 'Teamflow combines channels, threads, calls, and full-history search in one fast, keyboard-first app. No bolt-on integrations required for the essentials — it all just works out of the box.',
  },
  {
    q: 'Is there really a free plan?',
    a: 'Yes. Teams under 10 members are free forever, with 90 days of message history and 5 GB of file storage. No credit card required to start.',
  },
  {
    q: 'Can I migrate my existing workspace?',
    a: 'Absolutely. Our importer pulls in channels, messages, and files from most popular platforms in minutes. Enterprise plans include white-glove migration support.',
  },
  {
    q: 'How does pricing scale?',
    a: 'Pro is billed per active user per month, so you only pay for people who actually use Teamflow. Enterprise is a custom contract with volume pricing and an SLA.',
  },
  {
    q: 'Is my data secure?',
    a: 'All data is encrypted in transit and at rest. Enterprise plans add SSO/SAML, compliance exports, and configurable data-retention policies.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-[760px] px-6 py-24">
      <h2 className="text-center text-[clamp(28px,4vw,42px)] font-bold tracking-tightest text-ink mb-12">
        Frequently asked questions
      </h2>
      <div className="divide-y divide-divider border-y border-divider">
        {FAQS.map((f, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left group cursor-pointer"
              aria-expanded={open === i}
            >
              <span className="text-[16px] font-medium text-ink">{f.q}</span>
              <Icon
                name="chevdown"
                size={18}
                className={`text-sub shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <p className="pb-5 -mt-1 text-[14.5px] text-sub leading-[1.6] anim-slide">{f.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
