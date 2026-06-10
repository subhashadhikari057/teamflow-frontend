import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { AuthUser } from '@/lib/api/types';

export const ME_KEY = ['me'] as const;

export function useMe() {
  return useQuery<AuthUser, Error>({
    queryKey: ME_KEY,
    queryFn:  authApi.me,
    // Access token starts null on page load; the 401 interceptor will try a
    // refresh automatically. Only retry once so we don't hammer the server.
    retry: 1,
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
