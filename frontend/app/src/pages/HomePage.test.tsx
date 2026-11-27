import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCategory } from '@/api/categories'
import { getConfig } from '@/api/config'
import { getCourse, getCourses } from '@/api/courses'
import { listPaths } from '@/api/paths'
import type { Course, LearningPath, Module } from '@/api/types'
import { ToastProvider } from '@/components/Toast'
import { AuthProvider } from '@/hooks/useAuth'
import HomePage from '@/pages/HomePage'

vi.mock('@/api/config', () => ({ getConfig: vi.fn() }))
vi.mock('@/api/categories', () => ({ getCategory: vi.fn() }))
vi.mock('@/api/courses', () => ({ getCourse: vi.fn(), getCourses: vi.fn() }))
vi.mock('@/api/paths', () => ({ listPaths: vi.fn() }))
vi.mock('@/api/learning', () => ({ getDashboard: vi.fn() }))
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

function moduleAt(id: number): Module {
  return {
    id,
    module_name: `Day ${String(id).padStart(2, '0')}/50 - Lesson ${id} | Python`,
    module_description: '',
    module_video: null,
    embed_url: null,
    youtube_video_id: `vid${id}`,
    thumbnail_url: `https://i.ytimg.com/vi/vid${id}/hqdefault.jpg`,
    sort_order: id,
    can_view: true,
    is_completed: false,
    is_locked: false,
    duration_seconds: 600,
  }
}

function sampleCourse(overrides: Partial<Course> = {}): Course {
  const modules = Array.from({ length: 12 }, (_, i) => moduleAt(i + 1))
  return {
    id: 1,
    courses_name: '50 Days of Python Programming challenge',
    courses_description: '',
    is_premium: false,
    course_image: null,
    thumbnail_url: 'https://i.ytimg.com/vi/FDNHbLS28PY/hqdefault.jpg',
    playlist_url: '',
    youtube_playlist_id: 'p',
    slug: '50-days-of-python-programming-challenge',
    level: 'beginner',
    language: 'ur-hi',
    category: {
      name: 'Study with Ayaz',
      slug: 'study-with-ayaz',
      icon: '',
    },
    creator: {
      name: 'Ayaz',
      slug: 'ayaz',
      avatar_url: '',
      channel_url: '',
      is_owner: true,
    },
    attribution: '',
    module_count: modules.length,
    is_enrolled: false,
    is_wishlisted: false,
    progress_percent: 0,
    course_modules: modules,
    ...overrides,
  }
}

const paths: LearningPath[] = [
  {
    title: 'Python from zero',
    slug: 'python-from-zero',
    summary: 'Start here',
    level: 'Beginner',
    step_count: 3,
    steps: [
      {
        course: {
          slug: 'a',
          title: 'A',
          thumbnail: 'https://i.ytimg.com/vi/a/hqdefault.jpg',
        },
      },
      {
        course: {
          slug: 'b',
          title: 'B',
          thumbnail: 'https://i.ytimg.com/vi/b/hqdefault.jpg',
        },
      },
      {
        course: {
          slug: 'c',
          title: 'C',
          thumbnail: 'https://i.ytimg.com/vi/c/hqdefault.jpg',
        },
      },
    ],
  },
  {
    title: 'Django backend developer',
    slug: 'django-backend',
    summary: '',
    level: 'Beginner to intermediate',
    steps: [],
  },
  {
    title: 'Crack coding interviews',
    slug: 'interviews',
    summary: '',
    level: 'Intermediate',
    steps: [],
  },
]

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/', element: <HomePage /> }],
    { initialEntries: ['/'] },
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

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getConfig).mockResolvedValue({
      stripe_publishable_key: '',
      google_client_id: '',
      turnstile_site_key: '',
      published_course_count: 58,
      lesson_count: 2700,
      creator_count: 23,
      path_count: 5,
      language_count: 3,
      category_count: 8,
    })
    const featured = sampleCourse()
    vi.mocked(getCourse).mockResolvedValue(featured)
    vi.mocked(getCourses).mockResolvedValue({
      count: 58,
      next: null,
      previous: null,
      results: [
        featured,
        sampleCourse({
          id: 2,
          slug: 'react-course',
          courses_name: 'React course',
          creator: {
            name: 'Other',
            slug: 'other',
            avatar_url: '',
            channel_url: '',
            is_owner: false,
          },
          category: { name: 'Frontend', slug: 'frontend', icon: '' },
          course_modules: [],
        }),
      ],
    })
    vi.mocked(getCategory).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [featured],
      category: {
        id: 1,
        name: 'Study with Ayaz',
        slug: 'study-with-ayaz',
        description: '',
        icon: '',
        sort_order: 0,
        is_featured: true,
        published_course_count: 1,
      },
    } as never)
    vi.mocked(listPaths).mockResolvedValue(paths)
  })

  it('formats the numbers band from config', async () => {
    renderHome()
    expect(
      await screen.findByRole('heading', {
        name: /Learn to code from YouTube/i,
      }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('2,700')).toBeInTheDocument()
    })
    expect(screen.getByText('58')).toBeInTheDocument()
    expect(screen.getByText(/58 free courses · 23 teachers/)).toBeInTheDocument()
  })

  it('renders three learning path cards', async () => {
    renderHome()
    expect(
      await screen.findByRole('link', { name: /Python from zero/i }),
    ).toHaveAttribute('href', '/paths/python-from-zero')
    expect(screen.getByRole('link', { name: /Django backend/i })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Crack coding interviews/i }),
    ).toBeInTheDocument()
  })

  it('shows the logged-out featured start day 1 CTA', async () => {
    renderHome()
    expect(
      await screen.findByRole('link', { name: 'Start day 1' }),
    ).toBeInTheDocument()
  })
})
