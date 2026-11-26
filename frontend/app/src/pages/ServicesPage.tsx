import { EmptyState } from '@/components/EmptyState'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function ServicesPage() {
  usePageTitle('Services')
  return (
    <PageMain>
      <PageHeader title="Services" lead="Freelance work offered alongside the courses." />
      <EmptyState
        title="Services are not published yet"
        body="Write if you want to talk about a project."
        actionLabel="Contact"
        to="/contact"
      />
    </PageMain>
  )
}
