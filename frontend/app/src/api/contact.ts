import { api } from '@/api/client'

export type ContactPayload = {
  name: string
  email: string
  message: string
  turnstile_token?: string
}

export function sendContact(payload: ContactPayload): Promise<{ id: number }> {
  return api<{ id: number }>('/contact/', {
    method: 'POST',
    body: payload,
    auth: false,
    redirectOn401: false,
  })
}
