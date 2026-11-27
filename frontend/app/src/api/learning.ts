import { api } from '@/api/client'
import type {
  Dashboard,
  Enrollment,
  LessonProgress,
  WishlistItem,
} from '@/api/types'

export function getDashboard(): Promise<Dashboard> {
  return api<Dashboard>('/dashboard/')
}

export function getEnrollments(): Promise<Enrollment[]> {
  return api<Enrollment[]>('/enrollments/')
}

export function enrollCourse(slug: string): Promise<Enrollment> {
  return api<Enrollment>(`/courses/${encodeURIComponent(slug)}/enroll/`, {
    method: 'POST',
    body: {},
  })
}

export function markLessonProgress(
  moduleId: number,
  completed = true,
): Promise<LessonProgress> {
  return api<LessonProgress>(`/modules/${moduleId}/progress/`, {
    method: 'POST',
    body: { completed },
  })
}

export function saveLessonPosition(
  moduleId: number,
  seconds: number,
): Promise<LessonProgress> {
  return api<LessonProgress>('/learning/progress/position/', {
    method: 'POST',
    body: { module_id: moduleId, seconds: Math.max(0, Math.floor(seconds)) },
  })
}

export function getWishlist(): Promise<WishlistItem[]> {
  return api<WishlistItem[]>('/wishlist/')
}

export function addWishlist(slug: string): Promise<WishlistItem> {
  return api<WishlistItem>('/wishlist/', {
    method: 'POST',
    body: { slug },
  })
}

export function removeWishlist(slug: string): Promise<void> {
  return api<void>(`/wishlist/${encodeURIComponent(slug)}/`, {
    method: 'DELETE',
  })
}
