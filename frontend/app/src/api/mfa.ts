import { api } from '@/api/client'
import type { AuthSuccess, MfaSetup, MfaStatus, MessageResponse } from '@/api/types'

export function mfaVerify(payload: {
  challenge_token: string
  code: string
  method: string
}): Promise<AuthSuccess> {
  return api<AuthSuccess>('/auth/mfa/verify/', {
    method: 'POST',
    body: payload,
    auth: false,
    redirectOn401: false,
  })
}

export function mfaResend(challengeToken: string): Promise<MessageResponse> {
  return api<MessageResponse>('/auth/mfa/resend/', {
    method: 'POST',
    body: { challenge_token: challengeToken },
    auth: false,
    redirectOn401: false,
  })
}

export function mfaStatus(): Promise<MfaStatus> {
  return api<MfaStatus>('/auth/mfa/status/')
}

export function mfaSetup(): Promise<MfaSetup> {
  return api<MfaSetup>('/auth/mfa/setup/', { method: 'POST', body: {} })
}

export function mfaConfirm(
  code: string,
  method?: string,
): Promise<{
  recovery_codes?: string[]
  token?: string
  access?: string
  refresh?: string
  message?: string
}> {
  return api('/auth/mfa/confirm/', {
    method: 'POST',
    body: method ? { code, method } : { code },
  })
}

export function mfaSetupEmail(): Promise<MessageResponse> {
  return api<MessageResponse>('/auth/mfa/enable-email/', { method: 'POST', body: {} })
}

export function mfaConfirmEmail(code: string): Promise<MessageResponse> {
  return api<MessageResponse>('/auth/mfa/confirm-email/', {
    method: 'POST',
    body: { code },
  })
}

export function mfaDisable(payload: {
  password?: string
  code?: string
}): Promise<MessageResponse> {
  return api<MessageResponse>('/auth/mfa/disable/', {
    method: 'POST',
    body: payload,
  })
}
