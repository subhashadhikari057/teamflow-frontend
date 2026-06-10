import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { ME_KEY } from './useMe';
import type { LoginPayload, LoginResponse } from '@/lib/api/types';

export function useLogin() {
  const qc = useQueryClient();

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (!data.requiresTwoFactor) {
        // Backend set HttpOnly cookies — just hydrate the 'me' cache
        qc.setQueryData(ME_KEY, data.session.user);
      }
      // requiresTwoFactor === true: caller reads data.challengeToken and goes to 2FA step
    },
  });
}
