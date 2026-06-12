import WorkspacePage from '@/components/app/WorkspacePage';
import { getWorkspaceBootstrapData } from '@/lib/server/workspace-bootstrap';

export default async function WorkspaceFallbackPage() {
  const { initialUser, initialWorkspaces, initialChannels } = await getWorkspaceBootstrapData();

  return (
    <WorkspacePage
      routeWorkspaceSlug="workspace"
      initialUser={initialUser}
      initialWorkspaces={initialWorkspaces}
      initialChannels={initialChannels}
    />
  );
}
