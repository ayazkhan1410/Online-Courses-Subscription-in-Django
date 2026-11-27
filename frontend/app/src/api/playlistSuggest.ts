import { api } from '@/api/client'

export type PlaylistSuggestPayload = {
  url: string
  note: string
  email?: string
}

export function suggestPlaylist(payload: PlaylistSuggestPayload) {
  return api<{ id: number }>('/playlist-suggestions/', {
    method: 'POST',
    body: payload,
  })
}