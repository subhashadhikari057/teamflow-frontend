import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { RegisterPayload, ActionResponse } from '@/lib/api/types';

export function useRegister() {
  return useMutation<ActionResponse, Error, RegisterPayload>({
    mutationFn: authApi.register,
    // On success → direct user to check their email for verification
  });
}
