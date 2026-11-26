import { EmptyState } from '@/components/EmptyState'
import { PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function VerifyEmailPage() {
  usePageTitle('Verify email')
  return (
    <PageMain>
      <EmptyState
        title="No separate email check"
        body="Creating an account signs you in. There is no verification step to complete."
        actionLabel="Log in"
        to="/login"
      />
    </PageMain>
  )
}
