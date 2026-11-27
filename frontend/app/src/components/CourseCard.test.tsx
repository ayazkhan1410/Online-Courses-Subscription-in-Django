import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Course } from '@/api/types'
import { CourseCard } from '@/components/CourseCard'

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: 1,
    courses_name: 'Python notes',
    courses_description: 'A public playlist.',
    is_premium: true,
    course_image: null,
    thumbnail_url: '',
    playlist_url: 'https://www.youtube.com/playlist?list=abc',
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
    module_count: 12,
    is_enrolled: false,
    is_wishlisted: false,
    progress_percent: 0,
    ...overrides,
  }
}

function renderCard(value: Course) {
  return render(
    <MemoryRouter>
      <CourseCard course={value} />
    </MemoryRouter>,
  )
}

describe('CourseCard', () => {
  it('shows owner byline on the card', () => {
    renderCard(course())
    expect(screen.getByText('By Ayaz')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Python notes/i })).toHaveAttribute(
      'href',
      '/courses/python-notes',
    )
  })

  it('shows third-party creator name on the card', () => {
    renderCard(
      course({
        creator: {
          name: 'Corey Schafer',
          slug: 'corey-schafer',
          avatar_url: 'https://example.com/avatar.jpg',
          channel_url: 'https://www.youtube.com/@coreyms',
          is_owner: false,
        },
      }),
    )
    expect(screen.queryByText('By Ayaz')).not.toBeInTheDocument()
    expect(screen.getByText('Corey Schafer')).toBeInTheDocument()
  })

  it('shows the YouTube thumbnail when the course has one', () => {
    const { container } = renderCard(
      course({ thumbnail_url: 'https://i.ytimg.com/vi/abc/hqdefault.jpg' }),
    )
    const img = container.querySelector('img.cover-thumb')
    expect(img?.getAttribute('src')).toBe(
      'https://i.ytimg.com/vi/abc/hqdefault.jpg',
    )
  })

  it('falls back to the generated cover when the thumbnail fails', () => {
    const { container } = renderCard(
      course({ thumbnail_url: 'https://i.ytimg.com/vi/broken/hq.jpg' }),
    )
    fireEvent.error(container.querySelector('img.cover-thumb')!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.cover-title')).not.toBeNull()
  })
})