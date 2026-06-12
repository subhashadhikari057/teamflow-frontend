'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/auth';
import { getWorkspaceErrorMessage } from '@/lib/api/errors';
import { workspacesApi } from '@/lib/api/workspaces';
import { useToast } from '@/lib/toast-context';
import type {
  InviteWorkspaceMembersPayload,
  WorkspaceInviteSummary,
  WorkspaceMemberSummary,
  WorkspaceRole,
} from '@/lib/api/types';
import Icon from '@/components/primitives/Icon';
import Button from '@/components/primitives/Button';
import { ConfirmDialog, RoleBadge } from './_shared';

type RoleFilter = 'All' | WorkspaceRole;

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  GUEST: 'Guest',
};

const ROLE_OPTIONS: RoleFilter[] = ['All', 'OWNER', 'ADMIN', 'MEMBER', 'GUEST'];
const MEMBER_QUERY_KEY = 'workspace-members';
const INVITE_QUERY_KEY = 'workspace-invites';
const INVITE_ROLE_OPTIONS: Array<{
  role: WorkspaceRole;
  label: string;
  description: string;
}> = [
  { role: 'ADMIN', label: 'Admin', description: 'Can manage people, channels, and workspace settings.' },
  { role: 'MEMBER', label: 'Member', description: 'Can participate fully across the workspace.' },
  { role: 'GUEST', label: 'Guest', description: 'Gets limited access for scoped collaboration.' },
];

function getRoleLabel(role: WorkspaceRole) {
  return ROLE_LABELS[role];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function formatJoinedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatInviteDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function normalizeEmails(input: string) {
  return Array.from(new Set(
    input
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  ));
}

function MemberAvatar({ member }: { member: WorkspaceMemberSummary }) {
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt={member.name}
        className="w-[34px] h-[34px] rounded-lg object-cover shrink-0 border border-line"
      />
    );
  }

  return (
    <div
      className="w-[34px] h-[34px] rounded-lg shrink-0 flex items-center justify-center text-[13px] font-semibold text-white select-none"
      style={{ background: '#3b82f6' }}
    >
      {getInitials(member.name)}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line py-12 flex flex-col items-center justify-center text-muted">
      <Icon name={icon} size={24} />
      <p className="text-[13px] mt-3">{title}</p>
      <p className="text-[12px] mt-1">{description}</p>
    </div>
  );
}

function InviteMembersDialog({
  open,
  emails,
  role,
  isPending,
  onEmailsChange,
  onRoleChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  emails: string;
  role: WorkspaceRole;
  isPending: boolean;
  onEmailsChange: (value: string) => void;
  onRoleChange: (value: WorkspaceRole) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const normalizedEmails = normalizeEmails(emails);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-panel border border-line rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="w-11 h-11 rounded-xl bg-elevated border border-line flex items-center justify-center mb-3">
              <Icon name="users" size={18} className="text-sub" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink">Invite people</h3>
            <p className="text-[13px] text-sub mt-1 leading-relaxed">
              Add one email per line or separate addresses with commas. Everyone invited here will join with the role you choose below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-muted hover:text-ink transition shrink-0 disabled:opacity-40"
            aria-label="Close dialog"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.95fr)]">
          <div className="min-w-0 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="block text-[13px] font-medium text-ink">Email addresses</label>
                <span className="text-[12px] text-sub">
                  {normalizedEmails.length} {normalizedEmails.length === 1 ? 'recipient' : 'recipients'}
                </span>
              </div>
              <textarea
                value={emails}
                onChange={(event) => onEmailsChange(event.target.value)}
                placeholder={'alex@company.com\njamie@company.com'}
                className="w-full min-h-[180px] px-3 py-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition resize-none leading-[1.55]"
              />
              <div className="flex items-center gap-2 mt-2 text-[12px] text-sub">
                <Icon name="info" size={13} className="shrink-0" />
                <span>Duplicate addresses are collapsed before sending.</span>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-ink mb-2">Role</label>
              <div className="grid gap-2">
                {INVITE_ROLE_OPTIONS.map((option) => {
                  const selected = role === option.role;

                  return (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => onRoleChange(option.role)}
                      className={`w-full text-left rounded-lg border px-3 py-3 transition ${
                        selected
                          ? 'border-white bg-panel text-ink'
                          : 'border-line bg-elevated text-sub hover:border-[#555555] hover:text-ink'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium">{option.label}</div>
                          <div className="text-[12px] mt-1 leading-relaxed">{option.description}</div>
                        </div>
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                            selected ? 'border-white bg-white text-black' : 'border-divider'
                          }`}
                        >
                          {selected && <Icon name="check" size={11} strokeWidth={2.25} />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-w-0 border-t border-divider pt-5 md:border-t-0 md:border-l md:border-divider md:pl-6 md:pt-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-[13px] font-medium text-ink">Invite preview</div>
                <div className="text-[12px] text-sub mt-1">People will join as {getRoleLabel(role).toLowerCase()}s.</div>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full border border-line text-[11px] text-sub">
                {normalizedEmails.length === 0 ? 'No emails yet' : `${normalizedEmails.length} ready`}
              </span>
            </div>

            {normalizedEmails.length > 0 ? (
              <div className="flex flex-wrap gap-2 content-start">
                {normalizedEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-elevated border border-line px-2.5 py-1.5 text-[12px] text-ink"
                  >
                    <Icon name="at" size={12} className="text-sub shrink-0" />
                    <span className="truncate">{email}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center text-muted">
                <Icon name="users" size={20} />
                <p className="text-[13px] mt-3">Recipients will appear here.</p>
                <p className="text-[12px] mt-1">Paste or type email addresses to build the invite list.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={onSubmit} disabled={isPending} className="flex-1">
            {isPending ? 'Sending invites…' : 'Send invites'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MembersTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const me = useCurrentUser();
  const workspaceId = me?.currentWorkspace?.id;
  const workspaceName = me?.currentWorkspace?.name ?? 'Workspace';

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('MEMBER');
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberSummary | null>(null);

  const membersQuery = useQuery({
    queryKey: [MEMBER_QUERY_KEY, workspaceId],
    queryFn: () => workspacesApi.listMembers(workspaceId as string),
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  });

  const invitesQuery = useQuery({
    queryKey: [INVITE_QUERY_KEY, workspaceId],
    queryFn: () => workspacesApi.listInvites(workspaceId as string),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  });

  function refreshPeopleData() {
    if (!workspaceId) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: [MEMBER_QUERY_KEY, workspaceId] });
    void queryClient.invalidateQueries({ queryKey: [INVITE_QUERY_KEY, workspaceId] });
    void queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
  }

  const inviteMembers = useMutation({
    mutationFn: (payload: InviteWorkspaceMembersPayload) =>
      workspacesApi.inviteMembers(workspaceId as string, payload),
    onSuccess: (invites) => {
      refreshPeopleData();
      setInviteDialogOpen(false);
      setInviteEmails('');
      setInviteRole('MEMBER');
      toast.success(
        invites.length === 1 ? 'Invitation sent' : 'Invitations sent',
        invites.length === 1 ? `Sent to ${invites[0]?.email}.` : `Sent ${invites.length} invitations.`,
      );
    },
    onError: (error) => {
      toast.error(getWorkspaceErrorMessage(error));
    },
  });

  const resendInvite = useMutation({
    mutationFn: (invite: WorkspaceInviteSummary) =>
      workspacesApi.resendInvite(workspaceId as string, invite.id),
    onSuccess: (invite) => {
      refreshPeopleData();
      toast.success('Invitation resent', `Sent another email to ${invite.email}.`);
    },
    onError: (error) => {
      toast.error(getWorkspaceErrorMessage(error));
    },
  });

  const revokeInvite = useMutation({
    mutationFn: (invite: WorkspaceInviteSummary) =>
      workspacesApi.revokeInvite(workspaceId as string, invite.id),
    onSuccess: () => {
      refreshPeopleData();
      toast.success('Invitation revoked');
    },
    onError: (error) => {
      toast.error(getWorkspaceErrorMessage(error));
    },
  });

  const removeMember = useMutation({
    mutationFn: (member: WorkspaceMemberSummary) =>
      workspacesApi.removeMember(workspaceId as string, member.userId),
    onSuccess: (_, member) => {
      refreshPeopleData();
      setMemberToRemove(null);
      toast.success('Member removed', `${member.name} has been removed from ${workspaceName}.`);
    },
    onError: (error) => {
      toast.error(getWorkspaceErrorMessage(error));
    },
  });

  const filteredMembers = useMemo(() => {
    const members = membersQuery.data ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    return members.filter((member) => {
      const matchesQuery = normalizedQuery.length === 0
        || member.name.toLowerCase().includes(normalizedQuery)
        || member.username.toLowerCase().includes(normalizedQuery);
      const matchesRole = roleFilter === 'All' || member.role === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [membersQuery.data, query, roleFilter]);

  const pendingInvites = useMemo(
    () => (invitesQuery.data ?? []).filter((invite) => invite.status === 'PENDING'),
    [invitesQuery.data],
  );

  const normalizedInviteEmails = useMemo(
    () => normalizeEmails(inviteEmails),
    [inviteEmails],
  );

  function submitInvites() {
    if (normalizedInviteEmails.length === 0) {
      toast.warning('Enter at least one email address.');
      return;
    }

    inviteMembers.mutate({
      emails: normalizedInviteEmails,
      role: inviteRole,
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tightest text-ink">Members</h2>
          <p className="text-[13px] text-sub mt-0.5">
            {membersQuery.isLoading
              ? `Loading people in ${workspaceName}…`
              : `${membersQuery.data?.length ?? 0} people in ${workspaceName}`}
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          disabled={!workspaceId}
        >
          <Icon name="plus" size={15} /> Invite people
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter members…"
            className="w-full h-9 pl-9 pr-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] transition"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {ROLE_OPTIONS.map((role) => {
            const label = role === 'All' ? role : getRoleLabel(role);

            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`h-8 px-3 rounded-md text-[13px] font-medium transition ${roleFilter === role ? 'bg-elevated text-ink' : 'text-sub hover:bg-elevated hover:text-ink'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-line overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_88px_88px_72px] gap-4 px-4 h-10 items-center bg-panel border-b border-divider text-[11px] uppercase tracking-wider text-muted">
          <span>Member</span>
          <span>Role</span>
          <span className="text-right">Joined</span>
          <span className="text-right">Action</span>
        </div>

        {membersQuery.isLoading && (
          <div className="px-4 py-8 text-[13px] text-sub">Loading members…</div>
        )}

        {membersQuery.isError && (
          <div className="px-4 py-8 flex items-center justify-between gap-4">
            <p className="text-[13px] text-sub">We couldn&apos;t load workspace members.</p>
            <Button variant="secondary" size="sm" onClick={() => membersQuery.refetch()}>
              <Icon name="refresh" size={14} /> Retry
            </Button>
          </div>
        )}

        {!membersQuery.isLoading && !membersQuery.isError && filteredMembers.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] text-sub">
              {query || roleFilter !== 'All'
                ? 'No members match the current filters.'
                : 'No members found yet.'}
            </p>
          </div>
        )}

        {!membersQuery.isLoading && !membersQuery.isError && filteredMembers.map((member, index) => {
          const isCurrentUser = member.userId === me?.id;

          return (
            <div
              key={member.id}
              className={`grid grid-cols-[minmax(0,1fr)_88px_88px_72px] gap-4 px-4 h-[68px] items-center hover:bg-panel transition ${index < filteredMembers.length - 1 ? 'border-b border-divider' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <MemberAvatar member={member} />
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-ink truncate flex items-center gap-1.5">
                    {member.name}
                    {isCurrentUser && <span className="text-muted font-normal text-[12px]">(you)</span>}
                  </div>
                  <div className="text-[12px] text-sub truncate">@{member.username}</div>
                </div>
              </div>
              <div className="w-[88px]">
                <RoleBadge role={getRoleLabel(member.role)} />
              </div>
              <div className="w-[88px] text-right text-[13px] text-sub">{formatJoinedAt(member.joinedAt)}</div>
              <div className="w-[72px] flex justify-end">
                {!isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(member)}
                    className="text-[12px] text-sub hover:text-danger transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-[15px] font-semibold text-ink mb-3">Pending invitations</h3>

        {invitesQuery.isLoading && (
          <div className="rounded-lg border border-line px-4 py-8 text-[13px] text-sub">
            Loading pending invitations…
          </div>
        )}

        {invitesQuery.isError && (
          <div className="rounded-lg border border-line px-4 py-5 flex items-center justify-between gap-4">
            <p className="text-[13px] text-sub">We couldn&apos;t load pending invitations.</p>
            <Button variant="secondary" size="sm" onClick={() => invitesQuery.refetch()}>
              <Icon name="refresh" size={14} /> Retry
            </Button>
          </div>
        )}

        {!invitesQuery.isLoading && !invitesQuery.isError && pendingInvites.length === 0 && (
          <EmptyState
            icon="users"
            title="No pending invitations"
            description="Invite people with the button above"
          />
        )}

        {!invitesQuery.isLoading && !invitesQuery.isError && pendingInvites.length > 0 && (
          <div className="rounded-lg border border-line overflow-hidden">
            {pendingInvites.map((invite, index) => {
              const isResending = resendInvite.isPending && resendInvite.variables?.id === invite.id;
              const isRevoking = revokeInvite.isPending && revokeInvite.variables?.id === invite.id;

              return (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between gap-4 px-4 py-4 ${index < pendingInvites.length - 1 ? 'border-b border-divider' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-ink truncate">{invite.email}</div>
                    <div className="text-[12px] text-sub mt-1 flex items-center gap-2 flex-wrap">
                      <RoleBadge role={getRoleLabel(invite.role)} />
                      <span>Invited by {invite.invitedBy.name}</span>
                      <span>·</span>
                      <span>Sent {formatInviteDate(invite.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isResending || isRevoking}
                      onClick={() => resendInvite.mutate(invite)}
                    >
                      {isResending ? 'Sending…' : 'Resend'}
                    </Button>
                    <button
                      type="button"
                      disabled={isResending || isRevoking}
                      onClick={() => revokeInvite.mutate(invite)}
                      className="text-[12px] text-sub hover:text-danger transition disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {isRevoking ? 'Revoking…' : 'Revoke'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <InviteMembersDialog
        open={inviteDialogOpen}
        emails={inviteEmails}
        role={inviteRole}
        isPending={inviteMembers.isPending}
        onEmailsChange={setInviteEmails}
        onRoleChange={setInviteRole}
        onSubmit={submitInvites}
        onClose={() => {
          if (inviteMembers.isPending) {
            return;
          }

          setInviteDialogOpen(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(memberToRemove)}
        title="Remove member?"
        description={memberToRemove
          ? `This will remove ${memberToRemove.name} from ${workspaceName}.`
          : ''}
        warning="They will lose access to this workspace immediately."
        confirmLabel="Remove member"
        icon="warning"
        tone="danger"
        isPending={removeMember.isPending}
        onConfirm={() => {
          if (memberToRemove) {
            removeMember.mutate(memberToRemove);
          }
        }}
        onClose={() => setMemberToRemove(null)}
      />
    </div>
  );
}
