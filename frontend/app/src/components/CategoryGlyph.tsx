import {
  Binary,
  BookOpen,
  Brain,
  Briefcase,
  Code2,
  Container,
  GraduationCap,
  Layout,
  Server,
} from 'lucide-react'

const iconProps = {
  size: 18,
  strokeWidth: 1.5,
  'aria-hidden': true,
} as const

const FROM_ICON: Record<string, string> = {
  binary: 'binary',
  brain: 'brain',
  briefcase: 'briefcase',
  'code-2': 'code',
  container: 'container',
  'graduation-cap': 'cap',
  layout: 'layout',
  server: 'server',
}

const FROM_SLUG: Record<string, string> = {
  'ai-ml': 'brain',
  backend: 'server',
  devops: 'container',
  dsa: 'binary',
  freelancing: 'briefcase',
  frontend: 'layout',
  python: 'code',
  'study-with-ayaz': 'cap',
}

function glyphKey(icon?: string | null, slug?: string | null): string {
  const fromIcon = FROM_ICON[(icon ?? '').trim().toLowerCase()]
  if (fromIcon) return fromIcon
  if (slug && FROM_SLUG[slug]) return FROM_SLUG[slug]
  return 'book'
}

export function CategoryGlyph({
  icon,
  slug,
}: {
  icon?: string | null
  slug?: string | null
}) {
  switch (glyphKey(icon, slug)) {
    case 'brain':
      return <Brain {...iconProps} />
    case 'briefcase':
      return <Briefcase {...iconProps} />
    case 'code':
      return <Code2 {...iconProps} />
    case 'container':
      return <Container {...iconProps} />
    case 'cap':
      return <GraduationCap {...iconProps} />
    case 'layout':
      return <Layout {...iconProps} />
    case 'server':
      return <Server {...iconProps} />
    case 'binary':
      return <Binary {...iconProps} />
    default:
      return <BookOpen {...iconProps} />
  }
}
