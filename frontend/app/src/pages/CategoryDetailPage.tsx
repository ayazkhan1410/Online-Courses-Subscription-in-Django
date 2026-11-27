import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getCategory, listCategories } from '@/api/categories'
import { ApiError } from '@/api/client'
import { CourseBrowser } from '@/features/catalog/CourseBrowser'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'

function CategorySearch({
  search,
  onCommit,
}: {
  search: string
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(search)

  function onSearch(event: FormEvent) {
    event.preventDefault()
    onCommit(draft.trim())
  }

  return (
    <form className="search" role="search" onSubmit={onSearch}>
      <Search className="i" size={16} strokeWidth={1.5} aria-hidden />
      <input
        className="input"
        type="search"
        placeholder="Search"
        aria-label="Search courses"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </form>
  )
}

export default function CategoryDetailPage() {
  const { slug = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''

  const probe = useQuery({
    queryKey: ['category', slug, 1],
    queryFn: () => getCategory(slug, 1),
    enabled: Boolean(slug),
  })
  const categories = useQuery({ queryKey: ['categories'], queryFn: listCategories })

  usePageTitle(probe.data?.category.name ?? 'Category')

  function commitSearch(value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set('search', value)
    else next.delete('search')
    next.delete('page')
    setParams(next)
  }

  if (probe.isLoading) {
    return (
      <main className="wrap">
        <Skeleton className="h-24" />
      </main>
    )
  }

  const missing = probe.error instanceof ApiError && probe.error.status === 404
  if (missing || !slug) {
    return (
      <main className="wrap">
        <EmptyState
          title="Category not found"
          body="That category is not in the catalog."
          actionLabel="All categories"
          to="/categories"
        />
      </main>
    )
  }

  const category = probe.data?.category
  const totalCourses =
    categories.data?.reduce((sum, item) => sum + item.published_course_count, 0) ?? 0
  const categoryCount = categories.data?.length ?? 0

  return (
    <main className="wrap">
      <div className="page-head">
        <div>
          <h1 className="h1">{category?.name ?? 'Courses'}</h1>
          <p>
            {category
              ? category.description ||
                `${category.published_course_count} courses in this category.`
              : `${totalCourses} playlists in ${categoryCount} categories.`}
          </p>
        </div>
        <CategorySearch key={search} search={search} onCommit={commitSearch} />
      </div>
      <CourseBrowser lockedCategory={slug} />
    </main>
  )
}
