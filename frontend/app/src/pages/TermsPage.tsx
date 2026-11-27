import { Link } from 'react-router-dom'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'

export default function TermsPage() {
  usePageTitle('Terms', {
    description: PAGE_DESCRIPTIONS.terms,
    canonicalPath: '/terms',
  })
  return (
    <PageMain>
      <PageHeader title="Terms" lead="Plain terms for using the desk." />
      <div className="max-w-2xl space-y-4 text-ink-2">
        <p>Use your own account. Do not share the login or recovery codes.</p>
        <p>
          Third-party courses belong to their creators. Videos are embedded from YouTube.
          A creator can ask for a playlist to be removed through the{' '}
          <Link to="/contact" className="text-ink underline">
            contact page
          </Link>
          .
        </p>
        <p>
          Lessons can be removed if they can no longer be hosted. Progress already
          recorded stays on your account.
        </p>
      </div>
    </PageMain>
  )
}
