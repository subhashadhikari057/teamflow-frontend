import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { AuthUser } from '@/lib/api/types';
import {
  clearSessionHint,
  setSessionHint,
  useHasAuthHint,
} from '@/lib/auth-session-hint';

export const ME_KEY = ['me'] as const;

export function useMe() {
  const enabled = useHasAuthHint();

  return useQuery<AuthUser, Error>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        const user = await authApi.me();

        setSessionHint();

        return user;
      } catch (error) {
        if ((error as { status?: number }).status === 401) {
          clearSessionHint();
        }
        throw error;
      }
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useIsAuthLoading() {
  const { isLoading } = useMe();
  return isLoading;
}

export function useCurrentUser(): AuthUser | null {
  const { data } = useMe();
  return data ?? null;
}

export function useIsAuthenticated(): boolean {
  const { data, isSuccess } = useMe();
  return isSuccess && !!data;
}
