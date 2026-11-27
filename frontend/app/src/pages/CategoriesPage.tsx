import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listCategories } from '@/api/categories'
import { formatApiError } from '@/api/client'
import { CategoryGlyph } from '@/components/CategoryGlyph'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'
import { inkClass } from '@/lib/ink'

export default function CategoriesPage() {
  usePageTitle('Categories')
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })

  return (
    <main className="wrap">
      <div className="page-head" style={{ gridTemplateColumns: '1fr' }}>
        <div>
          <h1 className="h1">Categories</h1>
          <p>Playlists grouped by what they teach.</p>
        </div>
      </div>

      {query.isLoading ? (
        <div className="cats">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
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
        <div className="cats">
          {query.data.map((item) => {
            const cover = (item.cover_image_url || '').trim()
            return (
              <Link
                key={item.slug}
                to={`/categories/${item.slug}`}
                className={`cat${item.slug === 'study-with-ayaz' ? ' owner' : ''}${cover ? ' cat-media' : ''} ${inkClass(item.slug)}`}
              >
                {cover ? (
                  <img src={cover} alt="" className="cat-thumb" loading="lazy" />
                ) : null}
                <div className="cat-body">
                  <div className="cat-top">
                    <CategoryGlyph icon={item.icon} slug={item.slug} />
                    <span className="cat-count meta">{item.published_course_count}</span>
                  </div>
                  <h2 className="h3">{item.name}</h2>
                  {item.description ? <p>{item.description}</p> : null}
                </div>
              </Link>
            )
          })}
        </div>
      ) : null}
    </main>
  )
}
