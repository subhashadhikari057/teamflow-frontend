import 'server-only';

import { cookies } from 'next/headers';
import type { AuthUser, ChannelSummary, WorkspaceSummary } from '@/lib/api/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';

export interface WorkspaceBootstrapData {
  initialUser: AuthUser | null;
  initialWorkspaces: WorkspaceSummary[] | null;
  initialChannels: ChannelSummary[] | null;
}

async function fetchWithRequestCookies<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      cache: 'no-store',
      headers: {
        cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function getWorkspaceBootstrapData(): Promise<WorkspaceBootstrapData> {
  const initialUser = await fetchWithRequestCookies<AuthUser>('/auth/me');

  if (!initialUser) {
    return {
      initialUser: null,
      initialWorkspaces: null,
      initialChannels: null,
    };
  }

  const initialWorkspaces = await fetchWithRequestCookies<WorkspaceSummary[]>('/mobile/workspaces');
  const currentWorkspaceId = initialUser.currentWorkspace?.id;
  const initialChannels = currentWorkspaceId
    ? await fetchWithRequestCookies<ChannelSummary[]>(`/mobile/workspaces/${currentWorkspaceId}/channels`)
    : null;

  return {
    initialUser,
    initialWorkspaces,
    initialChannels,
  };
}
