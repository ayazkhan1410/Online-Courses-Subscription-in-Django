import { useQuery } from '@tanstack/react-query'
import { formatApiError } from '@/api/client'
import { getEnrollments } from '@/api/learning'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function DashboardCoursesPage() {
  usePageTitle('Your courses')
  const query = useQuery({ queryKey: ['enrollments'], queryFn: getEnrollments })
  return (
    <div>
      <h1 className="text-[32px]">Your courses</h1>
      <div className="mt-8">
        {query.isLoading ? <Skeleton className="h-64" /> : null}
        {query.isError ? (
          <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
        ) : null}
        {query.data && query.data.length === 0 ? (
          <EmptyState
            title="No enrollments yet"
            body="Courses you join will show up here."
            actionLabel="Browse courses"
            to="/courses"
          />
        ) : null}
        {query.data && query.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {query.data.map((item) => (
              <CourseCard key={item.id} course={item.course} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
