import { useQuery } from '@tanstack/react-query'
import { formatApiError } from '@/api/client'
import { getWishlist } from '@/api/learning'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function SavedPage() {
  usePageTitle('Saved')
  const query = useQuery({ queryKey: ['wishlist'], queryFn: getWishlist })
  if (query.isError) {
    return <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
  }
  if (!query.data) return null
  if (query.data.length === 0) {
    return (
      <EmptyState
        title="Nothing saved"
        body="Courses you save from the catalog will show up here."
        actionLabel="Browse courses"
        to="/courses"
      />
    )
  }
  return (
    <div>
      <h1 className="text-[32px]">Saved</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {query.data.map((item) => (
          <CourseCard key={item.id} course={item.course} />
        ))}
      </div>
    </div>
  )
}
