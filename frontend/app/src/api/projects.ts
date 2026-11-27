import { api } from '@/api/client'
import type { Project } from '@/api/types'

type ProjectsList = Project[] | { results: Project[] }

export async function listProjects(): Promise<Project[]> {
  const data = await api<ProjectsList>('/projects/', { auth: false, redirectOn401: false })
  if (Array.isArray(data)) return data
  return data.results ?? []
}