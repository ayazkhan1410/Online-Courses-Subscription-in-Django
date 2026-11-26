import { EmptyState } from '@/components/EmptyState'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function PathsPage() {
  usePageTitle('Paths')
  return (
    <PageMain>
      <PageHeader title="Paths" lead="Grouped routes through the catalog." />
      <EmptyState
        title="Learning paths are not published yet"
        body="Courses are available on their own while paths are still empty."
        actionLabel="Browse courses"
        to="/courses"
      />
    </PageMain>
  )
}
