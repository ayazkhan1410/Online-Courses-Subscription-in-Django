import { Link } from 'react-router-dom'
import type { Course } from '@/api/types'
import { CourseAttribution } from '@/components/CourseAttribution'
import { CourseCover } from '@/components/CourseCover'
import { Progress } from '@/components/Progress'
import { lessonIndex, lessonLabel, stripEmoji, stripHtml } from '@/lib/text'

function courseMeta(course: Course): string {
  const total = course.module_count
  if (course.is_enrolled) {
    return lessonLabel(lessonIndex(course.progress_percent, total), total)
  }
  const lessons = total === 1 ? '1 lesson' : `${total} lessons`
  if (course.category?.name) return `${lessons} · ${course.category.name}`
  return lessons
}

export function CourseCard({ course }: { course: Course }) {
  const title = stripEmoji(course.courses_name)
  const description = stripHtml(course.courses_description)
  const meta = courseMeta(course)
  const href = `/courses/${course.slug}`
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-200 ease-swa hover:border-line-strong">
      <Link to={href}>
        <CourseCover
          title={title}
          meta={meta}
          categorySlug={course.category?.slug}
          className="rounded-none"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 text-xl">
          <Link to={href}>{title}</Link>
        </h3>
        <CourseAttribution course={course} />
        {description ? (
          <p className="line-clamp-2 text-sm text-ink-2">{description}</p>
        ) : null}
        <p className="mt-auto font-mono text-xs text-ink-3">{meta}</p>
      </div>
      {course.is_enrolled ? <Progress value={course.progress_percent} /> : null}
    </article>
  )
}
