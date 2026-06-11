export function getWorkspacePath(workspaceSlug?: string | null): string {
  if (!workspaceSlug) {
    return '/workspace';
  }

  return `/${workspaceSlug}`;
}

export function getSettingsPath(workspaceSlug?: string | null, tab?: string): string {
  const query = new URLSearchParams();

  if (workspaceSlug) {
    query.set('from', workspaceSlug);
  }

  if (tab) {
    query.set('tab', tab);
  }

  const search = query.toString();

  return search ? `/settings?${search}` : '/settings';
}
