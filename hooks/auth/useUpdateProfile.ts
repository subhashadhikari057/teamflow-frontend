import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { ME_KEY } from './useMe';
import type { AuthUser, UpdateProfilePayload } from '@/lib/api/types';

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation<AuthUser, Error, UpdateProfilePayload>({
    mutationFn: authApi.updateProfile,
    onSuccess: (updated) => {
      qc.setQueryData<AuthUser>(ME_KEY, updated);
    },
  });
}
