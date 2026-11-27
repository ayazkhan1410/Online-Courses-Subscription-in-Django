import { api } from '@/api/client'

export type LessonNote = {
  id: number
  module: number
  seconds: number
  body: string
  created_at: string
  updated_at: string
  course_slug?: string
  course_name?: string
  lesson_name?: string
}

export function listModuleNotes(moduleId: number): Promise<LessonNote[]> {
  return api<LessonNote[]>(`/modules/${moduleId}/notes/`)
}

export function createModuleNote(
  moduleId: number,
  body: string,
  seconds: number,
): Promise<LessonNote> {
  return api<LessonNote>(`/modules/${moduleId}/notes/`, {
    method: 'POST',
    body: { body, seconds },
  })
}

export function updateNote(
  noteId: number,
  data: { body?: string; seconds?: number },
): Promise<LessonNote> {
  return api<LessonNote>(`/notes/${noteId}/`, {
    method: 'PATCH',
    body: data,
  })
}

export function deleteNote(noteId: number): Promise<void> {
  return api<void>(`/notes/${noteId}/`, { method: 'DELETE' })
}

export function listAllNotes(): Promise<LessonNote[]> {
  return api<LessonNote[]>('/notes/')
}
