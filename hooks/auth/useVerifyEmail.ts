import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { VerifyEmailPayload, ActionResponse } from '@/lib/api/types';

export function useVerifyEmail() {
  return useMutation<ActionResponse, Error, VerifyEmailPayload>({
    mutationFn: authApi.verifyEmail,
  });
}

export function useResendVerification() {
  return useMutation<ActionResponse, Error, { email: string }>({
    mutationFn: authApi.resendVerification,
  });
}
