import { EmptyState } from '@/components/EmptyState'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function CertificatesPage() {
  usePageTitle('Certificates')
  return (
    <EmptyState
      title="Certificates are not issued yet"
      body="Finishing a course does not create a certificate on this site."
      actionLabel="Browse courses"
      to="/courses"
    />
  )
}
