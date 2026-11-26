import { EmptyState } from '@/components/EmptyState'
import { PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function ServiceDetailPage() {
  usePageTitle('Service')
  return (
    <PageMain>
      <EmptyState
        title="This service is not published"
        body="Service pages are not listed yet."
        actionLabel="Contact"
        to="/contact"
      />
    </PageMain>
  )
}
