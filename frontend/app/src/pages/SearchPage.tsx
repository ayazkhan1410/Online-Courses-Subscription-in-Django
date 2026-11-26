import { useSearchParams } from 'react-router-dom'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { CourseBrowser } from '@/features/catalog/CourseBrowser'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function SearchPage() {
  usePageTitle('Search')
  const [params] = useSearchParams()
  const initial = params.get('search') ?? ''
  return (
    <PageMain>
      <PageHeader title="Search" lead="Find a course by name." />
      <CourseBrowser key={initial} initialSearch={initial} />
    </PageMain>
  )
}
