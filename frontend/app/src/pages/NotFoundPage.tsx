import { EmptyState } from '@/components/EmptyState'
import { PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Not found')
  return (
    <PageMain>
      <EmptyState
        title="Page not found"
        body="That address is not part of this site."
        actionLabel="Browse courses"
        to="/courses"
      />
    </PageMain>
  )
}
