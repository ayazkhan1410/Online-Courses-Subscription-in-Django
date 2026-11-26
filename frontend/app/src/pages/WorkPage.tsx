import { EmptyState } from '@/components/EmptyState'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function WorkPage() {
  usePageTitle('Work')
  return (
    <PageMain>
      <PageHeader title="Work" lead="Case studies from shipped projects." />
      <EmptyState
        title="Case studies are not published yet"
        body="There are no project write-ups to show."
        actionLabel="Contact"
        to="/contact"
      />
    </PageMain>
  )
}
