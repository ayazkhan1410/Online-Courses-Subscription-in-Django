import { EmptyState } from '@/components/EmptyState'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function TestimonialsPage() {
  usePageTitle('Testimonials')
  return (
    <PageMain>
      <PageHeader title="Testimonials" />
      <EmptyState
        title="No testimonials are published"
        body="This site does not invent reviews."
        actionLabel="Browse courses"
        to="/courses"
      />
    </PageMain>
  )
}
