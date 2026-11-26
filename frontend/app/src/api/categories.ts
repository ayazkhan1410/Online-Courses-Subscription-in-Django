import { api } from '@/api/client'
import type { Category, Course, Paginated } from '@/api/types'

export type CategoryDetail = Paginated<Course> & {
  category: Category
}

export function listCategories(): Promise<Category[]> {
  return api<Category[]>('/categories/')
}

export function getCategory(slug: string, page = 1): Promise<CategoryDetail> {
  const query = new URLSearchParams()
  if (page > 1) query.set('page', String(page))
  const suffix = query.toString()
  return api<CategoryDetail>(
    `/categories/${encodeURIComponent(slug)}/${suffix ? `?${suffix}` : ''}`,
  )
}
