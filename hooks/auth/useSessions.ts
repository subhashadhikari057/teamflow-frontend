import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { ActionResponse, SessionsListResponse } from '@/lib/api/types';

const SESSIONS_KEY = ['sessions'] as const;

export function useSessions() {
  return useQuery<SessionsListResponse, Error>({
    queryKey: SESSIONS_KEY,
    queryFn:  authApi.getSessions,
    staleTime: 60_000,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();

  return useMutation<ActionResponse, Error, string>({
    mutationFn: (id) => authApi.revokeSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function useRevokeAllSessions() {
  const qc = useQueryClient();

  return useMutation<ActionResponse, Error, void>({
    mutationFn: authApi.revokeAllSessions,
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}
