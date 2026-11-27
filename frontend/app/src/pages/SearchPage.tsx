import { useSearchParams } from 'react-router-dom'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { CourseBrowser } from '@/features/catalog/CourseBrowser'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'

export default function SearchPage() {
  usePageTitle('Search', {
    description: PAGE_DESCRIPTIONS.search,
    canonicalPath: '/search',
  })
  const [params] = useSearchParams()
  const initial = params.get('search') ?? ''
  return (
    <PageMain>
      <PageHeader title="Search" lead="Find a course by name." />
      <CourseBrowser key={initial} />
    </PageMain>
  )
}
