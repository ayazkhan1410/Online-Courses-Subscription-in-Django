import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'

export default function PrivacyPage() {
  usePageTitle('Privacy', {
    description: PAGE_DESCRIPTIONS.privacy,
    canonicalPath: '/privacy',
  })
  return (
    <PageMain>
      <PageHeader title="Privacy" lead="What this app stores." />
      <div className="max-w-2xl space-y-4 text-ink-2">
        <p>
          An account stores your name, email, enrollments, wishlist, and which lessons
          you mark complete. Passwords are stored as hashes.
        </p>
        <p>
          Lesson video is embedded from YouTube. This app stores your account and which
          lessons you finish, not the video file.
        </p>
        <p>
          Contact messages are kept so they can be answered. Sign-in can require a
          one-time code when two-factor authentication is on.
        </p>
      </div>
    </PageMain>
  )
}
