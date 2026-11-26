import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getCourses } from '@/api/courses'
import { formatApiError } from '@/api/client'
import { CourseCard } from '@/components/CourseCard'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Input } from '@/components/Input'
import { pageCount, Pagination } from '@/components/Pagination'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/Button'

export function CourseBrowser({
  initialSearch = '',
  initialPage = 1,
}: {
  initialSearch?: string
  initialPage?: number
}) {
  const [search, setSearch] = useState(initialSearch)
  const [submitted, setSubmitted] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const query = useQuery({
    queryKey: ['courses', submitted, page],
    queryFn: () => getCourses({ search: submitted, page }),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setSubmitted(search.trim())
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="mb-8 flex flex-col gap-3 sm:flex-row" role="search">
        <div className="flex-1">
          <Input
            label="Search courses"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            name="search"
          />
        </div>
        <Button type="submit" className="sm:mt-7">
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
          body="Try another word, or browse the full catalog."
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
            onPage={setPage}
          />
        </>
      ) : null}
    </div>
  )
}
