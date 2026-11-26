import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listCategories } from '@/api/categories'
import { formatApiError } from '@/api/client'
import { CategoryGlyph } from '@/components/CategoryGlyph'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function CategoriesPage() {
  usePageTitle('Categories')
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })

  return (
    <PageMain>
      <PageHeader title="Categories" lead="Playlists grouped by what they teach." />
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : null}
      {query.isError ? (
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.length === 0 ? (
        <EmptyState
          title="No categories yet"
          body="The catalog has no categories to browse."
          actionLabel="Browse courses"
          to="/courses"
        />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((item) => (
            <Link
              key={item.slug}
              to={`/categories/${item.slug}`}
              className="rounded-card border border-line bg-surface p-5 transition-colors duration-200 ease-swa hover:border-line-strong"
            >
              <CategoryGlyph icon={item.icon} slug={item.slug} />
              <h2 className="mt-4 text-2xl">{item.name}</h2>
              {item.description ? (
                <p className="mt-2 line-clamp-3 text-sm text-ink-2">{item.description}</p>
              ) : null}
              <p className="mt-3 font-mono text-xs text-ink-3">
                {item.published_course_count} courses
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </PageMain>
  )
}
