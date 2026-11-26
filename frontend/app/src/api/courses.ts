import { api } from '@/api/client'
import type { Course, Creator, Paginated } from '@/api/types'

export type CourseFilters = {
  search?: string
  category?: string
  creator?: string
  level?: string
  language?: string
  page?: number
}

export function getCourses(params: CourseFilters = {}): Promise<Paginated<Course>> {
  const query = new URLSearchParams()
  const search = params.search?.trim()
  const category = params.category?.trim()
  const creator = params.creator?.trim()
  const level = params.level?.trim()
  const language = params.language?.trim()
  if (search) query.set('search', search)
  if (category) query.set('category', category)
  if (creator) query.set('creator', creator)
  if (level) query.set('level', level)
  if (language) query.set('language', language)
  if (params.page && params.page > 1) query.set('page', String(params.page))
  const suffix = query.toString()
  return api<Paginated<Course>>(`/courses/${suffix ? `?${suffix}` : ''}`)
}

export function getCourse(slug: string): Promise<Course> {
  return api<Course>(`/courses/${encodeURIComponent(slug)}/`)
}

export async function listCreators(): Promise<Creator[]> {
  const seen = new Map<string, Creator>()
  let page = 1
  for (let guard = 0; guard < 12; guard += 1) {
    const data = await getCourses({ page })
    for (const course of data.results) {
      if (course.creator?.slug) seen.set(course.creator.slug, course.creator)
    }
    if (!data.next) break
    page += 1
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}
