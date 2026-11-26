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
          Lesson videos open in the player after you enroll.
        </p>
        <p>
          Premium courses stay locked until a Pro membership is active. Prices are shown
          on the pricing page when you are signed in.
        </p>
        <p>
          This site does not publish student counts, ratings, or testimonials.
        </p>
      </div>
    </PageMain>
  )
}
