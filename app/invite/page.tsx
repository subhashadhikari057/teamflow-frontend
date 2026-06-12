'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuthShell from '@/components/auth/AuthShell';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { ME_KEY } from '@/hooks/auth';
import { authApi } from '@/lib/api/auth';
import { getErrorCode } from '@/lib/api/client';
import {
  clearPostAuthRedirect,
  setPostAuthRedirect,
  setSessionHint,
} from '@/lib/auth-session-hint';
import { useToast } from '@/lib/toast-context';
import { workspacesApi } from '@/lib/api/workspaces';
import type { AuthUser, WorkspaceSummary } from '@/lib/api/types';
import { getWorkspacePath } from '@/lib/workspace-routing';

type InvitePageState =
  | 'missing-token'
  | 'needs-auth'
  | 'ready-to-confirm'
  | 'accepting'
  | 'already-member'
  | 'invalid-or-expired'
  | 'error';

function getRedirectToInvitePath(token: string) {
  return `/invite?token=${encodeURIComponent(token)}`;
}

function getCurrentWorkspaceDestination(user: AuthUser | null) {
  return getWorkspacePath(user?.currentWorkspace?.slug);
}

function classifyInviteError(error: unknown): Exclude<InvitePageState, 'ready-to-confirm' | 'accepting' | 'missing-token'> {
  const status = (error as { status?: number }).status;
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (status === 401) {
    return 'needs-auth';
  }

  if (message.includes('already a member')) {
    return 'already-member';
  }

  if (
    code === 'WORKSPACES_INVITE_EXPIRED'
    || code === 'WORKSPACES_INVITE_NOT_FOUND'
    || code === 'WORKSPACES_INVITE_ALREADY_PROCESSED'
    || message.includes('invite has expired')
    || message.includes('invite has been revoked')
    || message.includes('invite has been declined')
    || message.includes('invite has already been accepted')
    || message.includes('invite has already been used')
    || message.includes('invite not found')
    || message.includes('invite could not be found')
  ) {
    return 'invalid-or-expired';
  }

  return 'error';
}

function InviteCard({
  icon,
  title,
  description,
  note,
  actions,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  description: string;
  note?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-7">
      <div className="w-12 h-12 rounded-2xl bg-elevated border border-line flex items-center justify-center mx-auto mb-4 text-sub">
        <Icon name={icon} size={22} />
      </div>
      <h1 className="text-[22px] font-semibold tracking-tightest text-ink text-center">{title}</h1>
      <p className="text-[13.5px] text-sub text-center mt-2 leading-relaxed">{description}</p>
      {note && (
        <div className="rounded-xl border border-line bg-elevated px-4 py-3 text-[13px] text-sub leading-relaxed mt-5">
          {note}
        </div>
      )}
      {actions && <div className="mt-6 space-y-3">{actions}</div>}
    </div>
  );
}

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const token = searchParams.get('token')?.trim() ?? '';
  const [inviteOutcome, setInviteOutcome] = useState<'idle' | 'needs-auth' | 'already-member' | 'invalid-or-expired' | 'error'>('idle');
  const authQuery = useQuery<AuthUser, Error>({
    queryKey: ['invite-auth', token],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!authQuery.data) {
      return;
    }

    setSessionHint();
    queryClient.setQueryData(ME_KEY, authQuery.data);
  }, [authQuery.data, queryClient]);

  const user = authQuery.data ?? null;

  const acceptInvite = useMutation({
    mutationFn: async (inviteToken: string) => {
      const joinedWorkspace = await workspacesApi.acceptInvite({ token: inviteToken });

      try {
        const workspaces = await workspacesApi.list();
        queryClient.setQueryData<WorkspaceSummary[]>(['workspaces'], workspaces);
      } catch {
        void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      }

      const updatedUser = await authApi.setCurrentWorkspace({
        workspaceId: joinedWorkspace.id,
      });

      queryClient.setQueryData(ME_KEY, updatedUser);
      setSessionHint();

      return {
        joinedWorkspace,
        updatedUser,
      };
    },
    onSuccess: ({ joinedWorkspace }) => {
      clearInviteRedirectState();
      toast.success('Workspace joined', `Opening ${joinedWorkspace.name}…`);
      router.replace(getWorkspacePath(joinedWorkspace.slug));
    },
    onError: async (error) => {
      const nextState = classifyInviteError(error);

      if (nextState === 'already-member') {
        try {
          const workspaces = await workspacesApi.list();
          queryClient.setQueryData<WorkspaceSummary[]>(['workspaces'], workspaces);
        } catch {
          void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        }
      }

      setInviteOutcome(nextState);
    },
  });

  const loginHref = token ? `/login?redirectTo=${encodeURIComponent(getRedirectToInvitePath(token))}` : '/login';
  const signUpHref = token ? `/signup?redirectTo=${encodeURIComponent(getRedirectToInvitePath(token))}` : '/signup';
  const signedInDestination = useMemo(() => getCurrentWorkspaceDestination(user), [user]);
  const authStatus = (authQuery.error as { status?: number } | null)?.status;
  const inviteRedirectPath = getRedirectToInvitePath(token);

  function clearInviteRedirectState() {
    clearPostAuthRedirect();
  }

  function handleAccept() {
    if (!token || acceptInvite.isPending) {
      return;
    }

    setInviteOutcome('idle');
    acceptInvite.mutate(token);
  }

  function handleNotNow() {
    clearInviteRedirectState();
    router.push(signedInDestination);
  }

  if (!token) {
    return (
      <AuthShell>
        <InviteCard
          icon="warning"
          title="Invalid invite link"
          description="This invite link is missing or incomplete. Ask the sender for a new invite."
          actions={(
            <>
              <Button size="lg" className="w-full" onClick={() => router.push('/login')}>
                Go to login
              </Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={() => router.push('/')}>
                Go home
              </Button>
            </>
          )}
        />
      </AuthShell>
    );
  }

  if (inviteOutcome === 'needs-auth') {
    return (
      <AuthShell>
        <InviteCard
          icon="users"
          title="You’ve been invited"
          description="Your session expired before we could finish joining this workspace."
          note="Log in again with the same email address that received this invite."
          actions={(
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setPostAuthRedirect(inviteRedirectPath);
                  router.push(loginHref);
                }}
              >
                Log in
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setPostAuthRedirect(inviteRedirectPath);
                  router.push(signUpHref);
                }}
              >
                Create account
              </Button>
            </>
          )}
        />
      </AuthShell>
    );
  }

  if (inviteOutcome === 'already-member') {
    return (
      <AuthShell>
        <InviteCard
          icon="checkcircle"
          title="You’re already in"
          description="You are already a member of this workspace."
          actions={(
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  clearInviteRedirectState();
                  router.push('/workspace');
                }}
              >
                Open workspace list
              </Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={handleNotNow}>
                Stay here
              </Button>
            </>
          )}
        />
      </AuthShell>
    );
  }

  if (inviteOutcome === 'invalid-or-expired') {
    return (
      <AuthShell>
        <InviteCard
          icon="warning"
          title="This invite is no longer valid"
          description="Ask the workspace admin to send you a new invite link."
          note={user ? 'If this invite was sent to a different email address, sign in with that address instead.' : undefined}
          actions={(
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  clearInviteRedirectState();
                  router.push(user ? '/workspace' : '/login');
                }}
              >
                {user ? 'Go to workspaces' : 'Go to login'}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  clearInviteRedirectState();
                  router.push('/');
                }}
              >
                Go home
              </Button>
            </>
          )}
        />
      </AuthShell>
    );
  }

  if (authQuery.isPending) {
    return (
      <AuthShell>
        <InviteCard
          icon="users"
          title="Checking your invite"
          description="We’re verifying your session and preparing the workspace invite."
        />
      </AuthShell>
    );
  }

  if (authQuery.isError && authStatus === 401) {
    return (
      <AuthShell>
        <InviteCard
          icon="users"
          title="You’ve been invited"
          description="You have been invited to join a workspace on Teamflow."
          note="Log in or create an account with the same email address that received this invite."
          actions={(
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setPostAuthRedirect(inviteRedirectPath);
                  router.push(loginHref);
                }}
              >
                Log in
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setPostAuthRedirect(inviteRedirectPath);
                  router.push(signUpHref);
                }}
              >
                Create account
              </Button>
            </>
          )}
        />
      </AuthShell>
    );
  }

  if (inviteOutcome === 'error' || authQuery.isError) {
    return (
      <AuthShell>
        <InviteCard
          icon="info"
          title="We couldn’t process this invite"
          description="Something unexpected happened while handling this workspace invite."
          actions={(
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setInviteOutcome('idle');
                  void authQuery.refetch();
                }}
              >
                Try again
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  clearInviteRedirectState();
                  router.push(user ? '/workspace' : '/login');
                }}
              >
                {user ? 'Go to workspaces' : 'Go to login'}
              </Button>
            </>
          )}
        />
      </AuthShell>
    );
  }

  if (acceptInvite.isPending || inviteOutcome === 'idle') {
    return (
      <AuthShell>
        <InviteCard
          icon="users"
          title="Join workspace"
          description="You have been invited to join a workspace on Teamflow."
          note={user ? `Signed in as ${user.email}.` : undefined}
          actions={(
            <>
              <Button size="lg" className="w-full" onClick={handleAccept} disabled={acceptInvite.isPending}>
                {acceptInvite.isPending ? 'Joining workspace…' : 'Join workspace'}
              </Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={handleNotNow} disabled={acceptInvite.isPending}>
                Not now
              </Button>
            </>
          )}
        />
      </AuthShell>
    );
  }

  return null;
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={(
        <AuthShell>
          <div className="rounded-2xl border border-line bg-panel p-7 text-center text-[14px] text-sub">
            Loading invite…
          </div>
        </AuthShell>
      )}
    >
      <InvitePageContent />
    </Suspense>
  );
}
