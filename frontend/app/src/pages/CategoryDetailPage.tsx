import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { getCategory } from '@/api/categories'
import { ApiError, formatApiError } from '@/api/client'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageMain } from '@/components/PageHeader'
import { pageCount, Pagination } from '@/components/Pagination'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function CategoryDetailPage() {
  const { slug = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const query = useQuery({
    queryKey: ['category', slug, page],
    queryFn: () => getCategory(slug, page),
    enabled: Boolean(slug),
  })
  usePageTitle(query.data?.category.name ?? 'Category')

  if (query.isLoading) {
    return (
      <PageMain>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-24" />
      </PageMain>
    )
  }

  const missing = query.error instanceof ApiError && query.error.status === 404
  if (missing) {
    return (
      <PageMain>
        <EmptyState
          title="Category not found"
          body="That category is not in the catalog."
          actionLabel="All categories"
          to="/categories"
        />
      </PageMain>
    )
  }
  if (query.isError || !query.data) {
    return (
      <PageMain>
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      </PageMain>
    )
  }

  const { category, results, count } = query.data

  return (
    <PageMain>
      <Breadcrumbs
        items={[
          { label: 'Categories', to: '/categories' },
          { label: category.name },
        ]}
      />
      <h1>{category.name}</h1>
      {category.description ? (
        <p className="mt-3 max-w-2xl text-lg text-ink-2">{category.description}</p>
      ) : null}
      <p className="mt-4 font-mono text-sm text-ink-3">
        {category.published_course_count} courses
      </p>
      <h2 className="mt-12">Playlists</h2>
      {results.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No courses in this category"
            body="Nothing is published here yet."
            actionLabel="Browse courses"
            to="/courses"
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <Pagination
            page={page}
            pages={pageCount(count)}
            onPage={(next) => {
              const queryParams = new URLSearchParams(params)
              if (next > 1) queryParams.set('page', String(next))
              else queryParams.delete('page')
              setParams(queryParams)
            }}
          />
        </>
      )}
    </PageMain>
  )
}
