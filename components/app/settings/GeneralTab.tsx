'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ME_KEY, useCurrentUser } from '@/hooks/auth';
import { getWorkspaceErrorMessage, getWorkspaceLeaveErrorMessage } from '@/lib/api/errors';
import { authApi } from '@/lib/api/auth';
import { workspacesApi } from '@/lib/api/workspaces';
import { useToast } from '@/lib/toast-context';
import type { AuthUser, WorkspacePlan, WorkspaceSummary } from '@/lib/api/types';
import Button from '@/components/primitives/Button';
import Icon from '@/components/primitives/Icon';
import { ConfirmDialog } from './_shared';
import { getWorkspacePath } from '@/lib/workspace-routing';

const PLAN_LABELS: Record<WorkspacePlan, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

const PLAN_STYLES: Record<WorkspacePlan, string> = {
  FREE: 'border-line bg-elevated text-sub',
  PRO: 'border-white bg-panel text-ink',
  BUSINESS: 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#86efac]',
  ENTERPRISE: 'border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#93c5fd]',
};

const inputClass = 'w-full h-9 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition';
const textareaClass = 'w-full min-h-[96px] px-3 py-2.5 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition resize-none leading-[1.5]';

export default function GeneralTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const me = useCurrentUser();
  const workspaceId = me?.currentWorkspace?.id;
  const workspaceQuery = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspacesApi.getById(workspaceId as string),
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  });
  const workspaceName = workspaceQuery.data?.name ?? me?.currentWorkspace?.name ?? 'Workspace';
  const workspaceSlug = workspaceQuery.data?.slug ?? me?.currentWorkspace?.slug ?? 'workspace';
  const workspaceDescription = workspaceQuery.data?.description ?? '';
  const workspaceLogoUrl = workspaceQuery.data?.logoUrl ?? null;
  const workspacePlan = workspaceQuery.data?.plan;
  const [editing, setEditing] = useState(false);
  const [draftWsName, setDraftWsName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [localWorkspaceName, setLocalWorkspaceName] = useState<string | null>(null);
  const [localWorkspaceDescription, setLocalWorkspaceDescription] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'leave' | 'delete' | null>(null);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const displayWorkspaceName = localWorkspaceName ?? workspaceName;
  const displayWorkspaceDescription = localWorkspaceDescription ?? workspaceDescription;
  const workspaceInitial = displayWorkspaceName.trim().charAt(0).toUpperCase() || 'N';
  const showWorkspaceLogo = Boolean(workspaceLogoUrl && failedLogoUrl !== workspaceLogoUrl);

  function syncWorkspaceExitState() {
    const remainingWorkspaces = (queryClient.getQueryData<WorkspaceSummary[]>(['workspaces']) ?? [])
      .filter((workspace) => workspace.id !== workspaceId);

    queryClient.setQueryData(ME_KEY, (current: AuthUser | undefined) => (
      current ? { ...current, currentWorkspace: null } : current
    ));
    queryClient.setQueryData(['workspaces'], remainingWorkspaces);

    if (workspaceId) {
      queryClient.removeQueries({ queryKey: ['workspace', workspaceId] });
    }

    return remainingWorkspaces;
  }

  async function routeAfterWorkspaceExit(remainingWorkspaces: WorkspaceSummary[]) {
    if (remainingWorkspaces.length === 0) {
      router.replace('/onboarding');
      return;
    }

    const nextWorkspace = remainingWorkspaces[0];

    try {
      const updatedUser = await authApi.setCurrentWorkspace({
        workspaceId: nextWorkspace.id,
      });

      queryClient.setQueryData(ME_KEY, updatedUser);
      router.replace(getWorkspacePath(updatedUser.currentWorkspace?.slug ?? nextWorkspace.slug));
    } catch (error) {
      toast.error(getWorkspaceErrorMessage(error));
      router.replace('/workspace');
    }
  }

  const leaveWorkspace = useMutation({
    mutationFn: () => workspacesApi.leave(workspaceId as string),
    onSuccess: async (response) => {
      const remainingWorkspaces = syncWorkspaceExitState();
      setConfirmAction(null);
      toast.success('Left workspace', response.message);
      await routeAfterWorkspaceExit(remainingWorkspaces);
    },
    onError: (error) => {
      toast.error(getWorkspaceLeaveErrorMessage(error));
    },
  });

  const deleteWorkspace = useMutation({
    mutationFn: () => workspacesApi.delete(workspaceId as string),
    onSuccess: async () => {
      const remainingWorkspaces = syncWorkspaceExitState();
      setConfirmAction(null);
      toast.success('Workspace deleted successfully');
      await routeAfterWorkspaceExit(remainingWorkspaces);
    },
    onError: (error) => {
      toast.error(getWorkspaceErrorMessage(error));
    },
  });

  function startEditing() {
    setDraftWsName(displayWorkspaceName);
    setDraftDescription(displayWorkspaceDescription);
    setEditing(true);
  }

  function cancelEditing() {
    setDraftWsName(displayWorkspaceName);
    setDraftDescription(displayWorkspaceDescription);
    setEditing(false);
  }

  function save() {
    const nextName = draftWsName.trim();

    if (!nextName) {
      toast.warning('Workspace name cannot be empty.');
      return;
    }

    setLocalWorkspaceName(nextName);
    setLocalWorkspaceDescription(draftDescription.trim());
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      {workspaceQuery.isError && (
        <div className="mb-5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-sub">
          We couldn&apos;t load the latest workspace details. Showing your current workspace snapshot instead.
        </div>
      )}

      <div className="flex items-center gap-5 pb-7 border-b border-divider">
        <div className="relative shrink-0">
          {showWorkspaceLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={workspaceLogoUrl ?? undefined}
              alt={`${displayWorkspaceName} logo`}
              className="w-20 h-20 rounded-2xl object-cover border border-line"
              onError={() => setFailedLogoUrl(workspaceLogoUrl)}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-2xl select-none" style={{ letterSpacing: '-0.02em' }}>
              {workspaceInitial}
            </div>
          )}
          {editing && (
            <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-panel border border-line flex items-center justify-center text-sub hover:text-ink transition shadow-sm">
              <Icon name="compose" size={12} />
            </button>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[20px] font-semibold tracking-tightest text-ink truncate">{displayWorkspaceName}</div>
          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            <span className="text-[13px] text-sub">teamflow.io/{workspaceSlug}</span>
            {workspacePlan && (
              <>
                <span className="text-muted">·</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${PLAN_STYLES[workspacePlan]}`}>
                  {PLAN_LABELS[workspacePlan]}
                </span>
              </>
            )}
          </div>
          {!editing && (
            <p className="text-[13px] text-sub mt-2 max-w-[520px] leading-relaxed">
              {displayWorkspaceDescription || 'No workspace description yet.'}
            </p>
          )}
        </div>
      </div>

      <div className="divide-y divide-divider">
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Workspace name</span>
          {editing ? (
            <input
              className={inputClass}
              value={draftWsName}
              onChange={(event) => setDraftWsName(event.target.value)}
              placeholder="Workspace name"
            />
          ) : (
            <span className="text-[14px] text-ink">{displayWorkspaceName}</span>
          )}
        </div>
        <div className="flex items-start gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub pt-2">Description</span>
          {editing ? (
            <textarea
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              placeholder="What is this workspace for?"
              className={textareaClass}
            />
          ) : (
            <span className="text-[14px] text-ink leading-relaxed">{displayWorkspaceDescription || '—'}</span>
          )}
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Workspace URL</span>
          <span className="text-[14px] text-ink">teamflow.io/{workspaceSlug}</span>
        </div>
        <div className="flex items-center gap-4 py-4">
          <span className="w-32 shrink-0 text-[13px] text-sub">Plan</span>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[14px] text-ink">
              {workspacePlan ? PLAN_LABELS[workspacePlan] : workspaceQuery.isLoading ? 'Loading…' : 'Unavailable'}
            </span>
            {workspacePlan && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${PLAN_STYLES[workspacePlan]}`}>
                Current
              </span>
            )}
            <span className="text-[12px] text-sub">Manage in Billing.</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 gap-3">
        {editing ? (
          <>
            <Button variant="secondary" onClick={cancelEditing} disabled={leaveWorkspace.isPending || deleteWorkspace.isPending}>
              Cancel
            </Button>
            <Button onClick={save}>
              {saved ? <><Icon name="check" size={15} /> Saved!</> : 'Save changes'}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={startEditing}>
            <Icon name="compose" size={13} /> Edit general
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-danger/40 p-6 space-y-4 mt-8" style={{ background: 'rgba(239,68,68,0.04)' }}>
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Danger zone</h3>
          <p className="text-[13px] text-sub mt-0.5">Irreversible actions. Think twice.</p>
        </div>
        <div className="space-y-0 divide-y divide-danger/20">
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="text-[14px] text-ink">Leave workspace</div>
              <div className="text-[12px] text-sub mt-0.5">You will lose access to all channels and messages</div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={!workspaceId || leaveWorkspace.isPending || deleteWorkspace.isPending}
              onClick={() => setConfirmAction('leave')}
            >
              Leave
            </Button>
          </div>
          <div className="flex items-center justify-between pt-4">
            <div>
              <div className="text-[14px] text-danger">Delete workspace</div>
              <div className="text-[12px] text-sub mt-0.5">Permanently deletes {workspaceName} and all its data</div>
            </div>
            <Button
              variant="danger"
              size="sm"
              disabled={!workspaceId || leaveWorkspace.isPending || deleteWorkspace.isPending}
              onClick={() => setConfirmAction('delete')}
            >
              Delete workspace
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === 'leave'}
        title="Leave this workspace?"
        description={`You will lose access to ${workspaceName} and its channels unless someone invites you back.`}
        warning="If this is your only workspace, you will be sent back to workspace setup after leaving."
        confirmLabel="Leave workspace"
        icon="logout"
        tone="danger"
        isPending={leaveWorkspace.isPending}
        onConfirm={() => leaveWorkspace.mutate()}
        onClose={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === 'delete'}
        title="Delete this workspace?"
        description={`This permanently deletes ${workspaceName}, including messages, channels, and member access.`}
        warning="This action cannot be undone."
        confirmationText="delete my workspace"
        confirmationLabel={<>Type <span className="font-semibold text-ink">{'"delete my workspace"'}</span> to confirm.</>}
        confirmLabel="Delete workspace"
        icon="warning"
        tone="danger"
        isPending={deleteWorkspace.isPending}
        onConfirm={() => deleteWorkspace.mutate()}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}
