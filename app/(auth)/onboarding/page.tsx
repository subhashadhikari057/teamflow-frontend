'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import Stepper from '@/components/auth/Stepper';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';

const ALL_CHANNELS = ['general', 'marketing', 'engineering', 'design'];

function StepWorkspace({
  wsName, setWsName, onNext,
}: {
  wsName: string;
  setWsName: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tightest text-ink">What&apos;s your team called?</h1>
      <p className="text-[13.5px] text-sub mt-1.5 mb-6">This will be the name of your workspace.</p>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-md border border-dashed border-line bg-elevated flex items-center justify-center text-muted cursor-pointer hover:border-[#555555] transition shrink-0">
          <Icon name="plus" size={18} />
        </div>
        <div className="flex-1">
          <Field
            label="Workspace name"
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            placeholder="Acme Corp"
            autoFocus
          />
        </div>
      </div>
      <Button size="lg" className="w-full" onClick={onNext} disabled={!wsName.trim()}>
        Continue
      </Button>
    </>
  );
}

function StepInvite({
  invites, setInvites, onNext, onSkip,
}: {
  invites: string[];
  setInvites: (v: string[]) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const updateInvite = (i: number, val: string) =>
    setInvites(invites.map((x, j) => (j === i ? val : x)));

  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tightest text-ink">Invite your teammates</h1>
      <p className="text-[13.5px] text-sub mt-1.5 mb-6">Teamflow is better with your team. Add a few now.</p>
      <div className="space-y-3 mb-3">
        {invites.map((v, i) => (
          <input
            key={i}
            type="email"
            value={v}
            placeholder="teammate@company.com"
            onChange={(e) => updateInvite(i, e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition"
          />
        ))}
      </div>
      <button
        onClick={() => setInvites([...invites, ''])}
        className="text-[13px] text-sub hover:text-ink flex items-center gap-1.5 mb-6 transition cursor-pointer"
      >
        <Icon name="plus" size={14} /> Add another
      </button>
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onSkip}>
          Skip for now
        </Button>
        <Button size="lg" className="flex-1" onClick={onNext}>
          Send invites
        </Button>
      </div>
    </>
  );
}

function StepChannels({
  channels, toggleChannel, onFinish,
}: {
  channels: string[];
  toggleChannel: (c: string) => void;
  onFinish: () => void;
}) {
  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tightest text-ink">Pick your first channels</h1>
      <p className="text-[13.5px] text-sub mt-1.5 mb-6">Channels keep conversations organized by topic.</p>
      <div className="space-y-2 mb-6">
        {ALL_CHANNELS.map((c) => {
          const on = channels.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggleChannel(c)}
              className={`w-full flex items-center gap-3 px-3 h-11 rounded-md border transition text-left cursor-pointer ${
                on ? 'border-white bg-elevated' : 'border-line hover:border-[#555555]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                  on ? 'bg-white border-white' : 'border-line'
                }`}
              >
                {on && <Icon name="check" size={11} className="text-black" strokeWidth={3} />}
              </span>
              <span className="text-muted">#</span>
              <span className="text-[14px] text-ink">{c}</span>
            </button>
          );
        })}
      </div>
      <Button size="lg" className="w-full" onClick={onFinish} disabled={channels.length === 0}>
        Launch Teamflow
      </Button>
    </>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [wsName, setWsName] = useState('');
  const [invites, setInvites] = useState(['', '']);
  const [channels, setChannels] = useState(['general']);

  const toggleChannel = (c: string) =>
    setChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  return (
    <AuthShell>
      <Stepper step={step} total={3} />
      <div className="rounded-lg border border-line bg-panel p-7 anim-fade" key={step}>
        {step === 0 && (
          <StepWorkspace wsName={wsName} setWsName={setWsName} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepInvite
            invites={invites}
            setInvites={setInvites}
            onNext={() => setStep(2)}
            onSkip={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepChannels
            channels={channels}
            toggleChannel={toggleChannel}
            onFinish={() => router.push('/nomor')}
          />
        )}
      </div>
      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="block mx-auto mt-5 text-[13px] text-sub hover:text-ink transition cursor-pointer"
        >
          ← Back
        </button>
      )}
    </AuthShell>
  );
}
