import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type {
  ActionResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/lib/api/types';

export function useForgotPassword() {
  return useMutation<ActionResponse, Error, ForgotPasswordPayload>({
    mutationFn: authApi.forgotPassword,
  });
}

export function useResetPassword() {
  return useMutation<ActionResponse, Error, ResetPasswordPayload>({
    mutationFn: authApi.resetPassword,
    // Backend revokes all sessions — cookies become invalid; user must log in again
  });
}

export function useChangePassword() {
  const qc = useQueryClient();

  return useMutation<ActionResponse, Error, ChangePasswordPayload>({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      // Backend revoked all sessions — clear cache so useMe re-fetches and finds 401
      qc.clear();
    },
  });
}
