import WorkspacePage from '@/components/app/WorkspacePage';

export default async function WorkspaceSlugPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  return <WorkspacePage routeWorkspaceSlug={workspaceSlug} />;
}
