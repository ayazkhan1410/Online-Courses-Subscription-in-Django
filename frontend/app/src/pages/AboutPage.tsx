import { Link } from 'react-router-dom'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function AboutPage() {
  usePageTitle('About')
  return (
    <PageMain>
      <PageHeader
        title="About"
        lead="A study desk for programming courses and freelance practice."
      />
      <div className="max-w-2xl space-y-4 text-ink-2">
        <p>
          Study with Ayaz lists courses, enrolls you, and tracks which lessons you finish.
          Lesson videos play in the player after you enroll.
        </p>
        <p>
          Some playlists are made by other people. Those courses belong to their creators
          and are embedded from YouTube. To ask for a removal, use the{' '}
          <Link to="/contact" className="text-ink underline">
            contact page
          </Link>
          .
        </p>
        <p>
          This site does not publish student counts, ratings, or testimonials.
        </p>
      </div>
    </PageMain>
  )
}
