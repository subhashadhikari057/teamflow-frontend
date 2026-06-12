import WorkspacePage from '@/components/app/WorkspacePage';
import { getWorkspaceBootstrapData } from '@/lib/server/workspace-bootstrap';

export default async function WorkspaceSlugPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { initialUser, initialWorkspaces, initialChannels } = await getWorkspaceBootstrapData();

  return (
    <WorkspacePage
      routeWorkspaceSlug={workspaceSlug}
      initialUser={initialUser}
      initialWorkspaces={initialWorkspaces}
      initialChannels={initialChannels}
    />
  );
}
