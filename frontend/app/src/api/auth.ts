import { api } from '@/api/client'
import type {
  AuthSuccess,
  MfaChallenge,
  MessageResponse,
  User,
  VerificationRequired,
} from '@/api/types'

export type LoginPayload = {
  email: string
  password: string
  turnstile_token?: string
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
  turnstile_token?: string
}

export function isMfaChallenge(
  data: AuthSuccess | MfaChallenge | VerificationRequired,
): data is MfaChallenge {
  return 'mfa_required' in data && data.mfa_required === true
}

export function isVerificationRequired(
  data: AuthSuccess | MfaChallenge | VerificationRequired,
): data is VerificationRequired {
  return 'verification_required' in data && data.verification_required === true
}

export function register(
  payload: RegisterPayload,
): Promise<AuthSuccess | VerificationRequired> {
  return api<AuthSuccess | VerificationRequired>('/auth/register/', {
    method: 'POST',
    body: payload,
    auth: false,
    redirectOn401: false,
  })
}

export function login(
  payload: LoginPayload,
): Promise<AuthSuccess | MfaChallenge | VerificationRequired> {
  return api<AuthSuccess | MfaChallenge | VerificationRequired>('/auth/login/', {
    method: 'POST',
    body: payload,
    auth: false,
    redirectOn401: false,
  })
}

export function googleLogin(credential: string): Promise<AuthSuccess | MfaChallenge> {
  return api<AuthSuccess | MfaChallenge>('/auth/google/', {
    method: 'POST',
    body: { credential },
    auth: false,
    redirectOn401: false,
  })
}

export function logout(): Promise<MessageResponse> {
  return api<MessageResponse>('/auth/logout/', { method: 'POST', body: {} })
}

export function getMe(): Promise<User> {
  return api<User>('/auth/me/')
}

export function updateSettings(payload: {
  show_name_on_completion?: boolean
  timezone?: string
  daily_goal?: 1 | 2 | 3
  weekly_email?: boolean
}): Promise<User> {
  return api<User>('/auth/me/', { method: 'PATCH', body: payload })
}

export function forgetPassword(payload: {
  email: string
  turnstile_token?: string
}): Promise<MessageResponse> {
  return api<MessageResponse>('/auth/forget-password/', {
    method: 'POST',
    body: payload,
    auth: false,
    redirectOn401: false,
  })
}

export function changePassword(payload: {
  token: string
  password: string
  confirm_password: string
}): Promise<MessageResponse> {
  return api<MessageResponse>('/auth/change-password/', {
    method: 'POST',
    body: payload,
    auth: false,
    redirectOn401: false,
  })
}
