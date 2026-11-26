import { api } from '@/api/client'
import type { MessageResponse, Plan } from '@/api/types'

export function getPlans(): Promise<Plan[]> {
  return api<Plan[]>('/subscriptions/')
}

export function becomePro(payload: {
  membership: number
  stripe_token: string
}): Promise<MessageResponse> {
  return api<MessageResponse>('/become-pro/', {
    method: 'POST',
    body: payload,
  })
}
