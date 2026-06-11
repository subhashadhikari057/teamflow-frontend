'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import Stepper from '@/components/auth/Stepper';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { useMe, ME_KEY } from '@/hooks/auth';
import { authApi } from '@/lib/api/auth';
import { workspacesApi } from '@/lib/api/workspaces';
import { canUsePendingOauthSession, hasSessionHint } from '@/lib/auth-session-hint';
import { useToast } from '@/lib/toast-context';
import { getWorkspacePath } from '@/lib/workspace-routing';

function StepWorkspace({
  wsName,
  setWsName,
  onNext,
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
  invites,
  setInvites,
  onNext,
  onSkip,
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
          Continue
        </Button>
      </div>
    </>
  );
}

function StepLaunch({
  workspaceName,
  isPending,
  onFinish,
}: {
  workspaceName: string;
  isPending: boolean;
  onFinish: () => void;
}) {
  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tightest text-ink">You&apos;re almost in</h1>
      <p className="text-[13.5px] text-sub mt-1.5 mb-6">
        We&apos;ll create <span className="text-ink font-medium">{workspaceName || 'your workspace'}</span> with a default <span className="text-ink font-medium">#general</span> channel.
      </p>
      <div className="rounded-md border border-line bg-elevated p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md border border-line bg-panel flex items-center justify-center shrink-0">
            <Icon name="hash" size={16} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-ink">Default channel</p>
            <p className="text-[13px] text-sub mt-1">Every new workspace starts with <span className="text-ink">#general</span>. You can add more channels after setup.</p>
          </div>
        </div>
      </div>
      <Button size="lg" className="w-full" onClick={onFinish} disabled={isPending}>
        {isPending ? 'Creating workspace…' : 'Launch Teamflow'}
      </Button>
    </>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: me, isLoading: isMeLoading, isError: isMeError } = useMe();
  const [step, setStep] = useState(0);
  const [wsName, setWsName] = useState('');
  const [invites, setInvites] = useState(['', '']);

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
    enabled: Boolean(me),
    retry: false,
    staleTime: 60_000,
  });

  const onboarding = useMutation({
    mutationFn: workspacesApi.createOnboarding,
  });

  const normalizedInvites = useMemo(
    () =>
      invites
        .map((value) => value.trim())
        .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index),
    [invites],
  );

  useEffect(() => {
    if (!hasSessionHint() && !canUsePendingOauthSession()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (isMeError) {
      router.replace('/login');
    }
  }, [isMeError, router]);

  useEffect(() => {
    if (me?.currentWorkspace?.id) {
      router.replace(getWorkspacePath(me.currentWorkspace.slug));
      return;
    }

    if (workspacesQuery.isSuccess && workspacesQuery.data.length > 0) {
      router.replace(getWorkspacePath(workspacesQuery.data[0].slug));
    }
  }, [me?.currentWorkspace, router, workspacesQuery.data, workspacesQuery.isSuccess]);

  async function handleFinish() {
    if (!wsName.trim()) {
      toast.warning('Please enter a workspace name.');
      return;
    }

    try {
      const result = await onboarding.mutateAsync({
        name: wsName.trim(),
        invites: normalizedInvites.map((email) => ({ email })),
      });

      const updatedUser = await authApi.setCurrentWorkspace({
        workspaceId: result.workspace.id,
      });

      queryClient.setQueryData(ME_KEY, updatedUser);
      queryClient.setQueryData(['workspaces'], [result.workspace]);

      toast.success('Workspace ready', `Welcome to ${result.workspace.name}.`);
      router.push(getWorkspacePath(updatedUser.currentWorkspace?.slug ?? result.workspace.slug));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'We could not finish onboarding.');
    }
  }

  if (isMeLoading || workspacesQuery.isLoading) {
    return (
      <AuthShell>
        <div className="rounded-lg border border-line bg-panel p-7">
          <p className="text-[14px] text-sub">Preparing your workspace setup…</p>
        </div>
      </AuthShell>
    );
  }

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
          <StepLaunch
            workspaceName={wsName.trim()}
            isPending={onboarding.isPending}
            onFinish={handleFinish}
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
