import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listCategories } from '@/api/categories'
import { getCourses } from '@/api/courses'
import { CourseBrowser } from '@/features/catalog/CourseBrowser'
import { PlaylistSuggestPanel } from '@/features/catalog/PlaylistSuggestPanel'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'

function CoursesSearch({
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

export default function CoursesPage() {
  usePageTitle('Courses', {
    description: PAGE_DESCRIPTIONS.courses,
    canonicalPath: '/courses',
  })
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''

  const categories = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const catalog = useQuery({
    queryKey: ['courses', 'catalog-head'],
    queryFn: () => getCourses({ page: 1 }),
  })

  const totalCourses = catalog.data?.count ?? 0
  const categoryCount = categories.data?.length ?? 0

  function commitSearch(value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set('search', value)
    else next.delete('search')
    next.delete('page')
    setParams(next)
  }

  return (
    <main className="wrap">
      <div className="page-head">
        <div>
          <h1 className="h1">Courses</h1>
          <p>
            {totalCourses > 0 && categoryCount > 0
              ? `${totalCourses} free playlists in ${categoryCount} categories. Filter by topic, teacher or language.`
              : 'Search the catalog and open a course.'}
          </p>
        </div>
        <CoursesSearch key={search} search={search} onCommit={commitSearch} />
      </div>
      <CourseBrowser />
      <PlaylistSuggestPanel />
    </main>
  )
}
