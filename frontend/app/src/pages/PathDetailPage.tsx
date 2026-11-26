import { EmptyState } from '@/components/EmptyState'
import { PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function PathDetailPage() {
  usePageTitle('Path')
  return (
    <PageMain>
      <EmptyState
        title="This path is not published"
        body="There is no path catalog to open yet."
        actionLabel="Browse courses"
        to="/courses"
      />
    </PageMain>
  )
}
