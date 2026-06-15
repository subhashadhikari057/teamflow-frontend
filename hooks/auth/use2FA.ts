import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { ME_KEY } from './useMe';
import { storeAccessToken } from '@/lib/auth-access-token';
import { setSessionHint } from '@/lib/auth-session-hint';
import { USER_PREFERENCE_SETTING_QUERY_KEY } from '@/lib/user-preference-setting';
import type {
  Confirm2FAPayload,
  Disable2FAPayload,
  LoginResponse,
  RegenerateBackupCodesPayload,
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
  const qc = useQueryClient();
  return useMutation<TwoFactorBackupCodesResponse, Error, Confirm2FAPayload>({
    mutationFn: authApi.confirm2FA,
    onSuccess: () => qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}

// Used during login when requiresTwoFactor === true
export function useVerify2FA() {
  const qc = useQueryClient();

  return useMutation<LoginResponse, Error, Verify2FAPayload>({
    mutationFn: authApi.verify2FA,
    onSuccess: (data) => {
      if (!data.requiresTwoFactor) {
        storeAccessToken(data.session.tokens.accessToken);
        // Backend set cookies — force a fresh /auth/me on app boot
        setSessionHint();
        qc.removeQueries({ queryKey: ME_KEY });
        qc.removeQueries({ queryKey: USER_PREFERENCE_SETTING_QUERY_KEY });
      }
    },
  });
}

// Disable 2FA (requires current password)
export function useDisable2FA() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, Disable2FAPayload>({
    mutationFn: authApi.disable2FA,
    onSuccess: () => qc.invalidateQueries({ queryKey: ME_KEY }),
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

// Regenerate backup codes (requires current password)
export function useRegenerateBackupCodes() {
  const qc = useQueryClient();

  return useMutation<TwoFactorBackupCodesResponse, Error, RegenerateBackupCodesPayload>({
    mutationFn: authApi.regenerateBackupCodes,
    onSuccess:  (data) => qc.setQueryData(['2fa', 'backup-codes'], data),
  });
}
