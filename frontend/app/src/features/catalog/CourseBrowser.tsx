import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listCategories } from '@/api/categories'
import { formatApiError } from '@/api/client'
import { getCourses, listCreators } from '@/api/courses'
import { Button } from '@/components/Button'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Input } from '@/components/Input'
import { pageCount, Pagination } from '@/components/Pagination'
import { Select } from '@/components/Select'
import { Skeleton } from '@/components/Skeleton'
import { cn } from '@/lib/cn'

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ur-hi', label: 'Urdu / Hindi' },
]

function readPage(value: string | null): number {
  const page = Number(value || '1')
  return Number.isFinite(page) && page > 0 ? page : 1
}

export function CourseBrowser() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const category = params.get('category') ?? ''
  const creator = params.get('creator') ?? ''
  const level = params.get('level') ?? ''
  const language = params.get('language') ?? ''
  const page = readPage(params.get('page'))
  const [draft, setDraft] = useState(search)
  const [seenSearch, setSeenSearch] = useState(search)
  if (search !== seenSearch) {
    setSeenSearch(search)
    setDraft(search)
  }

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })
  const creators = useQuery({
    queryKey: ['creators'],
    queryFn: listCreators,
  })
  const query = useQuery({
    queryKey: ['courses', { search, category, creator, level, language, page }],
    queryFn: () => getCourses({ search, category, creator, level, language, page }),
  })

  function update(partial: Record<string, string>, nextPage = 1) {
    const merged = {
      search,
      category,
      creator,
      level,
      language,
      ...partial,
    }
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(merged)) {
      if (value) queryParams.set(key, value)
    }
    if (nextPage > 1) queryParams.set('page', String(nextPage))
    setParams(queryParams)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    update({ search: draft.trim() }, 1)
  }

  const creatorOptions = creators.data ?? []
  const knownCreator = creatorOptions.some((item) => item.slug === creator)

  return (
    <div>
      <div role="group" aria-label="Category" className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={category === ''}
          className={cn(
            'h-8 rounded-control border px-3 text-sm',
            category === ''
              ? 'border-line-strong bg-raised text-ink'
              : 'border-line text-ink-2 hover:bg-raised',
          )}
          onClick={() => update({ category: '' }, 1)}
        >
          All
        </button>
        {(categories.data ?? []).map((item) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={category === item.slug}
            className={cn(
              'h-8 rounded-control border px-3 text-sm',
              category === item.slug
                ? 'border-line-strong bg-raised text-ink'
                : 'border-line text-ink-2 hover:bg-raised',
            )}
            onClick={() => update({ category: item.slug }, 1)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mb-8 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr_auto] lg:items-end" role="search">
        <Select
          label="Creator"
          value={creator}
          onChange={(event) => update({ creator: event.target.value }, 1)}
        >
          <option value="">All creators</option>
          {creator && !knownCreator ? <option value={creator}>{creator}</option> : null}
          {creatorOptions.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.is_owner ? 'Ayaz' : item.name}
            </option>
          ))}
        </Select>
        <Select
          label="Level"
          value={level}
          onChange={(event) => update({ level: event.target.value }, 1)}
        >
          <option value="">All levels</option>
          {LEVELS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          label="Language"
          value={language}
          onChange={(event) => update({ language: event.target.value }, 1)}
        >
          <option value="">All languages</option>
          {LANGUAGES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input
          label="Search courses"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          name="search"
        />
        <Button type="submit" className="lg:mb-0">
          Search
        </Button>
      </form>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : null}
      {query.isError ? (
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.results.length === 0 ? (
        <EmptyState
          title="No courses match"
          body="Try another word, or clear the filters."
          actionLabel="Browse courses"
          to="/courses"
        />
      ) : null}
      {query.data && query.data.results.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.results.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <Pagination
            page={page}
            pages={pageCount(query.data.count)}
            onPage={(next) => update({}, next)}
          />
        </>
      ) : null}
    </div>
  )
}
