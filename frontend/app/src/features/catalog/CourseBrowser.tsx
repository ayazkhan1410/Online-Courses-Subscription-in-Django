import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listCategories } from '@/api/categories'
import { formatApiError } from '@/api/client'
import { getCourses, listCreators } from '@/api/courses'
import { CategoryGlyph } from '@/components/CategoryGlyph'
import { Chip } from '@/components/Chip'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { pageCount, Pagination } from '@/components/Pagination'
import { Panel } from '@/components/Panel'
import { Skeleton } from '@/components/Skeleton'

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

const LANGUAGE_CHIPS = [
  { value: '', label: 'All' },
  { value: 'ur-hi', label: 'Urdu / Hindi' },
  { value: 'en', label: 'English' },
]

function readPage(value: string | null): number {
  const page = Number(value || '1')
  return Number.isFinite(page) && page > 0 ? page : 1
}

type Props = {
  lockedCategory?: string
}

export function CourseBrowser({ lockedCategory }: Props) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const category = lockedCategory || (params.get('category') ?? '')
  const creatorsParam = params.getAll('creator')
  const creator = creatorsParam[0] ?? ''
  const levelsParam = params.getAll('level')
  const level = levelsParam[0] ?? ''
  const languagesParam = params.getAll('language')
  const language = languagesParam[0] ?? ''
  const page = readPage(params.get('page'))

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

  const selectedCategory = useMemo(
    () => categories.data?.find((item) => item.slug === category),
    [categories.data, category],
  )

  function update(partial: Record<string, string>, nextPage = 1) {
    const merged = {
      search,
      category: lockedCategory ? '' : category,
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

  function toggleFilter(key: 'creator' | 'level' | 'language', value: string) {
    const current =
      key === 'creator' ? creator : key === 'level' ? level : language
    update({ [key]: current === value ? '' : value }, 1)
  }

  const creatorOptions = creators.data ?? []
  const totalCount = categories.data?.reduce((sum, item) => sum + item.published_course_count, 0)

  return (
    <>
      <div className="tabs" id="categories">
        <div className="chips" role="group" aria-label="Category">
          {!lockedCategory ? (
            <Chip
              pressed={category === ''}
              onClick={() => update({ category: '' }, 1)}
              meta={totalCount ?? undefined}
            >
              All
            </Chip>
          ) : null}
          {(categories.data ?? []).map((item) => (
            <Chip
              key={item.slug}
              pressed={category === item.slug}
              onClick={() => {
                if (lockedCategory) {
                  if (item.slug !== lockedCategory) navigate(`/categories/${item.slug}`)
                  return
                }
                update({ category: item.slug }, 1)
              }}
              meta={item.published_course_count}
            >
              {item.name}
            </Chip>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Language" style={{ marginTop: 10 }}>
          {LANGUAGE_CHIPS.map((item) => (
            <Chip
              key={item.label}
              pressed={language === item.value}
              onClick={() => update({ language: item.value }, 1)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="layout">
        <aside className="filters" aria-label="Filters">
          <FilterBlock title="Teacher">
            {creatorOptions.map((item) => (
              <label className="check" key={item.slug}>
                <input
                  type="checkbox"
                  checked={creator === item.slug}
                  onChange={() => toggleFilter('creator', item.slug)}
                />
                {item.is_owner ? 'Ayaz' : item.name}
              </label>
            ))}
          </FilterBlock>
          <FilterBlock title="Level">
            {LEVELS.map((item) => (
              <label className="check" key={item.value}>
                <input
                  type="checkbox"
                  checked={level === item.value}
                  onChange={() => toggleFilter('level', item.value)}
                />
                {item.label}
              </label>
            ))}
          </FilterBlock>
        </aside>

        <section>
          {selectedCategory ? (
            <Panel className="cat-intro">
              <CategoryGlyph icon={selectedCategory.icon} slug={selectedCategory.slug} />
              <div>
                <h2 className="h3">{selectedCategory.name}</h2>
                {selectedCategory.description ? <p>{selectedCategory.description}</p> : null}
              </div>
            </Panel>
          ) : null}

          <div className="results-bar">
            <div className="active-filters">
              <span className="meta">
                {query.data ? `${query.data.count} courses` : '…'}
              </span>
              {creator ? <ActiveTag label={creatorOptions.find((c) => c.slug === creator)?.name ?? creator} onClear={() => update({ creator: '' }, 1)} /> : null}
              {level ? <ActiveTag label={LEVELS.find((l) => l.value === level)?.label ?? level} onClear={() => update({ level: '' }, 1)} /> : null}
              {language ? <ActiveTag label={LANGUAGES.find((l) => l.value === language)?.label ?? language} onClear={() => update({ language: '' }, 1)} /> : null}
            </div>
          </div>

          {query.isLoading ? (
            <div className="grid grid-3">
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
              <div className="grid grid-3">
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
        </section>
      </div>

    </>
  )
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4>{title}</h4>
      {children}
    </div>
  )
}

function ActiveTag({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="tag">
      {label}
      <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${label}`} onClick={onClear}>
        ×
      </button>
    </span>
  )
}