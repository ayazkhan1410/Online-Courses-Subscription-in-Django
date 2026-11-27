import { api } from '@/api/client'
import type { CompletionCard, CompletionBrief } from '@/api/types'

export function getCompletions(): Promise<CompletionCard[]> {
  return api<CompletionCard[]>('/completions/')
}

export function getCompletion(shareId: string): Promise<CompletionCard> {
  return api<CompletionCard>(`/completions/${encodeURIComponent(shareId)}/`, {
    auth: false,
  })
}

export type LessonProgressResponse = {
  id: number
  module: number
  completed: boolean
  position_seconds: number
  updated_at: string
  completion?: CompletionBrief
}