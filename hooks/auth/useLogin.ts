import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { ME_KEY } from './useMe';
import type { LoginPayload, LoginResponse } from '@/lib/api/types';
import { setSessionHint } from '@/lib/auth-session-hint';

export function useLogin() {
  const qc = useQueryClient();

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (!data.requiresTwoFactor) {
        // Backend set HttpOnly cookies — force a fresh /auth/me on app boot
        setSessionHint();
        qc.removeQueries({ queryKey: ME_KEY });
      }
      // requiresTwoFactor === true: caller reads data.challengeToken and goes to 2FA step
    },
  });
}
