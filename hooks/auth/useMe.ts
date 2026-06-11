import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { AuthUser } from '@/lib/api/types';
import { clearSessionHint, hasSessionHint } from '@/lib/auth-session-hint';

export const ME_KEY = ['me'] as const;

export function useMe() {
  const enabled = hasSessionHint();

  return useQuery<AuthUser, Error>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if ((error as { status?: number }).status === 401) {
          clearSessionHint();
        }
        throw error;
      }
    },
    enabled,
    // authApi.me() already performs one refresh attempt on 401.
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Convenience — returns true while the initial auth check is in flight
export function useIsAuthLoading() {
  const { isLoading } = useMe();
  return isLoading;
}

// Convenience — returns the user or null (undefined treated as null)
export function useCurrentUser(): AuthUser | null {
  const { data } = useMe();
  return data ?? null;
}

// Convenience — true only when user is confirmed authenticated
export function useIsAuthenticated(): boolean {
  const { data, isSuccess } = useMe();
  return isSuccess && !!data;
}
