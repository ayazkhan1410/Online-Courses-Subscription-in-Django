import { api } from '@/api/client'
import type { AuthSuccess, MessageResponse } from '@/api/types'

export function verifyEmail(payload: {
  email: string
  code: string
}): Promise<AuthSuccess> {
  return api<AuthSuccess>('/auth/verify-email/', {
    method: 'POST',
    body: payload,
    auth: false,
    redirectOn401: false,
  })
}

export function resendVerifyEmail(email: string): Promise<MessageResponse> {
  return api<MessageResponse>('/auth/verify-email/resend/', {
    method: 'POST',
    body: { email },
    auth: false,
    redirectOn401: false,
  })
}