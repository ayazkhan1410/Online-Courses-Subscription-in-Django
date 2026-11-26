import { render, screen } from '@testing-library/react'
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
  it('shows a quiet owner label and the playlist link', () => {
    renderCard(course())
    expect(screen.getByText('By Ayaz')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ayaz' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Watch on YouTube' })).toHaveAttribute(
      'href',
      'https://www.youtube.com/playlist?list=abc',
    )
    expect(screen.queryByText('Pro')).not.toBeInTheDocument()
  })

  it('links a third-party creator to their channel', () => {
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
    expect(screen.getByRole('link', { name: 'Corey Schafer' })).toHaveAttribute(
      'href',
      'https://www.youtube.com/@coreyms',
    )
  })
})
