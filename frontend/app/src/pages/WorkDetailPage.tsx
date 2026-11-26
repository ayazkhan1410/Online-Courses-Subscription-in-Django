import { EmptyState } from '@/components/EmptyState'
import { PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function WorkDetailPage() {
  usePageTitle('Case study')
  return (
    <PageMain>
      <EmptyState
        title="This case study is not published"
        body="Project pages are not listed yet."
        actionLabel="Contact"
        to="/contact"
      />
    </PageMain>
  )
}
