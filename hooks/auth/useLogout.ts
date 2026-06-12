import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { ActionResponse } from '@/lib/api/types';
import { clearAuthFlowState, clearSessionHint } from '@/lib/auth-session-hint';

export function useLogout() {
  const qc = useQueryClient();

  return useMutation<ActionResponse, Error, void>({
    mutationFn: authApi.logout, // backend clears HttpOnly cookies
    onSettled: () => {
      clearSessionHint();
      clearAuthFlowState();
      qc.clear(); // wipe all cached data regardless of server response
    },
  });
}
