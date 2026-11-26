import { PageHeader, PageMain } from '@/components/PageHeader'
import { CourseBrowser } from '@/features/catalog/CourseBrowser'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function CoursesPage() {
  usePageTitle('Courses')
  return (
    <PageMain>
      <PageHeader title="Courses" lead="Search the catalog and open a course." />
      <CourseBrowser />
    </PageMain>
  )
}
