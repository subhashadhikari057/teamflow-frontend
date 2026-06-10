import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';

const PLANS = [
  {
    name: 'Free', price: '$0', unit: '/mo', popular: false,
    features: ['Up to 10 members', '90 days message history', '5 GB file storage', 'Basic integrations'],
    cta: 'Get started free', variant: 'secondary' as const,
  },
  {
    name: 'Pro', price: '$7', unit: '/user/mo', popular: true,
    features: ['Unlimited members', 'Full message history', '50 GB storage', 'Unlimited integrations', 'Priority support'],
    cta: 'Start Pro trial', variant: 'primary' as const,
  },
  {
    name: 'Enterprise', price: 'Custom', unit: '', popular: false,
    features: ['SSO + SAML', 'Compliance exports', 'SLA guarantee', 'Dedicated support', 'Custom contracts'],
    cta: 'Contact sales', variant: 'secondary' as const,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-[1100px] px-6 py-24">
      <div className="text-center mb-14">
        <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tightest text-ink">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-[18px] text-sub">Start free. Scale as you grow.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-lg bg-panel p-7 ${p.popular ? 'border border-white md:-translate-y-3' : 'border border-line'}`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-black text-[11px] font-semibold whitespace-nowrap">
                Most Popular
              </div>
            )}
            <div className="text-[15px] font-semibold text-ink uppercase tracking-wide">{p.name}</div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[40px] font-bold tracking-tightest text-ink">{p.price}</span>
              <span className="text-[14px] text-sub">{p.unit}</span>
            </div>
            <div className="my-6 h-px bg-divider" />
            <ul className="space-y-3 mb-7">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-[#d4d4d4]">
                  <Icon name="check" size={16} className="text-ink mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={p.variant} size="lg" className="w-full">
              {p.cta}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
