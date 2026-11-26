import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function TermsPage() {
  usePageTitle('Terms')
  return (
    <PageMain>
      <PageHeader title="Terms" lead="Plain terms for using the desk." />
      <div className="max-w-2xl space-y-4 text-ink-2">
        <p>Use your own account. Do not share the login or recovery codes.</p>
        <p>
          Premium lessons stay available while your Pro membership is active. Free
          lessons follow the enrollment rules on each course.
        </p>
        <p>
          Lessons can be removed if they can no longer be hosted. Progress already
          recorded stays on your account.
        </p>
      </div>
    </PageMain>
  )
}
