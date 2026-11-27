import { api } from '@/api/client'
import type { LearningPath, LearningPathDetail } from '@/api/types'

type PathsList = LearningPath[] | { results: LearningPath[] }

export async function listPaths(): Promise<LearningPath[]> {
  const data = await api<PathsList>('/paths/', { redirectOn401: false })
  if (Array.isArray(data)) return data
  return data.results ?? []
}

export function getPath(slug: string): Promise<LearningPathDetail> {
  return api<LearningPathDetail>(`/paths/${encodeURIComponent(slug)}/`, {
    redirectOn401: false,
  })
}