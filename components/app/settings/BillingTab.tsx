'use client';

import Icon from '@/components/primitives/Icon';
import Button from '@/components/primitives/Button';

const plans = [
  { name: 'Free',       price: '$0',     label: 'per seat/mo',  current: false, features: ['Up to 5 members', '10k message history', '5 GB storage'] },
  { name: 'Pro',        price: '$7',     label: 'per seat/mo',  current: true,  features: ['Unlimited members', '∞ message history', '50 GB storage'] },
  { name: 'Enterprise', price: 'Custom', label: 'contact sales', current: false, features: ['SSO & SAML', 'Audit logs & SLA', 'Dedicated CSM'] },
];

const usage = [
  { label: 'Members',         val: '5 of unlimited',     pct: 18, sub: '5 active members' },
  { label: 'File storage',    val: '18.4 GB of 50 GB',   pct: 37, sub: '31.6 GB remaining' },
  { label: 'API calls',       val: '4,210 of 100k / mo', pct: 4,  sub: 'Resets Jul 1' },
  { label: 'Message history', val: '∞ messages',         pct: 0,  sub: 'Unlimited on Pro' },
];

const invoices = [
  { date: 'Jun 1, 2026', amount: '$35.00', status: 'Paid' },
  { date: 'May 1, 2026', amount: '$35.00', status: 'Paid' },
  { date: 'Apr 1, 2026', amount: '$35.00', status: 'Paid' },
  { date: 'Mar 1, 2026', amount: '$28.00', status: 'Paid' },
];

export default function BillingTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[20px] font-semibold tracking-tightest text-ink">Billing</h2>
        <p className="text-[13px] text-sub mt-0.5">Manage your plan, usage and payment method.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {plans.map(plan => (
          <div key={plan.name} className={`rounded-lg border p-5 flex flex-col gap-3 transition ${plan.current ? 'border-white bg-panel' : 'border-line'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-ink">{plan.name}</span>
              {plan.current && <span className="text-[11px] border border-white text-ink px-2 py-0.5 rounded-full">Current</span>}
            </div>
            <div>
              <span className="text-[22px] font-bold tracking-tightest text-ink">{plan.price}</span>
              <span className="text-[12px] text-sub ml-1">{plan.label}</span>
            </div>
            <ul className="space-y-1.5 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-[13px] text-sub">
                  <Icon name="check" size={12} className="text-ink shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {!plan.current && (
              <Button variant={plan.name === 'Enterprise' ? 'secondary' : 'primary'} size="sm">
                {plan.name === 'Enterprise' ? 'Contact sales' : 'Upgrade'}
              </Button>
            )}
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-ink mb-3">Usage</h3>
        <div className="grid grid-cols-2 gap-3">
          {usage.map(s => (
            <div key={s.label} className="rounded-lg border border-line bg-panel p-4">
              <div className="text-[13px] text-sub">{s.label}</div>
              <div className="text-[17px] font-semibold text-ink mt-0.5 tracking-tightest">{s.val}</div>
              {s.pct > 0 && (
                <div className="h-1.5 rounded-full bg-elevated mt-2.5 overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${s.pct}%` }} />
                </div>
              )}
              <div className="text-[11px] text-muted mt-1.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-ink mb-3">Payment method</h3>
        <div className="rounded-lg border border-line bg-panel p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 rounded-md bg-elevated border border-divider flex items-center justify-center">
              <Icon name="card" size={16} className="text-ink" />
            </div>
            <div>
              <div className="text-[14px] text-ink">Visa ending in 4242</div>
              <div className="text-[12px] text-sub">Expires 09 / 2027</div>
            </div>
          </div>
          <Button variant="secondary" size="sm">Update</Button>
        </div>
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-ink mb-3">Invoice history</h3>
        <div className="rounded-lg border border-line overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] px-4 h-9 items-center bg-panel border-b border-divider text-[11px] uppercase tracking-wider text-muted gap-4">
            <span>Date</span><span>Amount</span><span className="w-16 text-center">Status</span><span className="w-12 text-right">PDF</span>
          </div>
          {invoices.map((inv, i) => (
            <div key={inv.date} className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 h-12 items-center hover:bg-panel transition ${i < invoices.length - 1 ? 'border-b border-divider' : ''}`}>
              <span className="text-[14px] text-ink">{inv.date}</span>
              <span className="text-[14px] text-ink">{inv.amount}</span>
              <span className="w-16 text-center">
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{inv.status}</span>
              </span>
              <span className="w-12 text-right">
                <button className="text-[13px] text-sub hover:text-ink transition">↓</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
