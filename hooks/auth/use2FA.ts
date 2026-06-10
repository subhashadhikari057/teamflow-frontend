import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { ME_KEY } from './useMe';
import type {
  Confirm2FAPayload,
  Disable2FAPayload,
  LoginResponse,
  TwoFactorBackupCodesResponse,
  TwoFactorEnableResponse,
  Verify2FAPayload,
} from '@/lib/api/types';

// Step 1 — initiate 2FA setup; returns QR code URL + secret
export function useEnable2FA() {
  return useMutation<TwoFactorEnableResponse, Error, void>({
    mutationFn: authApi.enable2FA,
  });
}

// Step 2 — confirm 2FA setup with first TOTP code; returns backup codes
export function useConfirm2FA() {
  return useMutation<TwoFactorBackupCodesResponse, Error, Confirm2FAPayload>({
    mutationFn: authApi.confirm2FA,
  });
}

// Used during login when requiresTwoFactor === true
export function useVerify2FA() {
  const qc = useQueryClient();

  return useMutation<LoginResponse, Error, Verify2FAPayload>({
    mutationFn: authApi.verify2FA,
    onSuccess: (data) => {
      if (!data.requiresTwoFactor) {
        // Backend set cookies — hydrate cache
        qc.setQueryData(ME_KEY, data.session.user);
      }
    },
  });
}

// Disable 2FA (requires current password)
export function useDisable2FA() {
  return useMutation<{ message: string }, Error, Disable2FAPayload>({
    mutationFn: authApi.disable2FA,
  });
}

// Read backup codes (only available 15 min after generate/regenerate)
export function useBackupCodes(enabled = false) {
  return useQuery<TwoFactorBackupCodesResponse, Error>({
    queryKey: ['2fa', 'backup-codes'],
    queryFn:  authApi.getBackupCodes,
    enabled,
    staleTime: 0,
    retry:     false,
  });
}

// Regenerate backup codes
export function useRegenerateBackupCodes() {
  const qc = useQueryClient();

  return useMutation<TwoFactorBackupCodesResponse, Error, void>({
    mutationFn: authApi.regenerateBackupCodes,
    onSuccess:  (data) => qc.setQueryData(['2fa', 'backup-codes'], data),
  });
}
