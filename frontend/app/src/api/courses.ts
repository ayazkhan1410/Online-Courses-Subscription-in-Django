import { api } from '@/api/client'
import type { Course, Paginated } from '@/api/types'

export function getCourses(params: {
  search?: string
  page?: number
}): Promise<Paginated<Course>> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.page && params.page > 1) query.set('page', String(params.page))
  const suffix = query.toString()
  return api<Paginated<Course>>(`/courses/${suffix ? `?${suffix}` : ''}`)
}

export function getCourse(slug: string): Promise<Course> {
  return api<Course>(`/courses/${encodeURIComponent(slug)}/`)
}
