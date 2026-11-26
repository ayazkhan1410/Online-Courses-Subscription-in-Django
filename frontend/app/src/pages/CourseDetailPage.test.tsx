import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCourse } from '@/api/courses'
import type { Course } from '@/api/types'
import { ToastProvider } from '@/components/Toast'
import { AuthProvider } from '@/hooks/useAuth'
import CourseDetailPage from '@/pages/CourseDetailPage'

vi.mock('@/api/courses', () => ({
  getCourse: vi.fn(),
}))

const playlist = 'https://www.youtube.com/playlist?list=abc'

function sample(): Course {
  return {
    id: 4,
    courses_name: 'Python notes',
    courses_description: '<p>A public playlist.</p>',
    is_premium: true,
    course_image: null,
    thumbnail_url: '',
    playlist_url: playlist,
    youtube_playlist_id: 'abc',
    slug: 'python-notes',
    level: 'beginner',
    language: 'en',
    category: { name: 'Python', slug: 'python', icon: 'code-2' },
    creator: {
      name: 'Ayaz',
      slug: 'ayaz',
      avatar_url: '',
      channel_url: 'https://www.youtube.com/@ayaz',
      is_owner: true,
    },
    attribution: 'YouTube playlist by Ayaz',
    module_count: 1,
    is_enrolled: false,
    is_wishlisted: false,
    progress_percent: 0,
    course_modules: [
      {
        id: 9,
        module_name: 'Day 1',
        module_description: '',
        module_video: null,
        embed_url: null,
        youtube_video_id: null,
        thumbnail_url: null,
        sort_order: 1,
        can_view: false,
        is_completed: false,
        is_locked: true,
      },
    ],
  }
}

function renderPage(course: Course) {
  vi.mocked(getCourse).mockResolvedValue(course)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/courses/:slug', element: <CourseDetailPage /> }],
    { initialEntries: [`/courses/${course.slug}`] },
  )
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('CourseDetailPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getCourse).mockReset()
  })

  it('shows owner attribution and enroll-only lock', async () => {
    renderPage(sample())
    expect(await screen.findByText('By Ayaz')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Watch on YouTube' })).toHaveAttribute(
      'href',
      playlist,
    )
    expect(screen.getByText('Enroll to open')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'See Pro' })).not.toBeInTheDocument()
    expect(screen.queryByText('Pro')).not.toBeInTheDocument()
  })
})
