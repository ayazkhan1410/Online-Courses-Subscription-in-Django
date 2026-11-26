import { Link } from 'react-router-dom'
import type { Course } from '@/api/types'
import { CourseCover } from '@/components/CourseCover'
import { Progress } from '@/components/Progress'
import { Tag } from '@/components/Tag'
import { lessonIndex, lessonLabel, stripEmoji, stripHtml } from '@/lib/text'

export function CourseCard({ course }: { course: Course }) {
  const title = stripEmoji(course.courses_name)
  const description = stripHtml(course.courses_description)
  const total = course.module_count
  const meta = course.is_enrolled
    ? lessonLabel(lessonIndex(course.progress_percent, total), total)
    : `${total} lessons`
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-200 ease-swa hover:border-line-strong"
    >
      <CourseCover title={title} meta={meta} className="rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-xl">{title}</h3>
          {course.is_premium ? <Tag>Pro</Tag> : null}
        </div>
        {description ? (
          <p className="line-clamp-2 text-sm text-ink-2">{description}</p>
        ) : null}
        <p className="mt-auto font-mono text-xs text-ink-3">{meta}</p>
      </div>
      {course.is_enrolled ? <Progress value={course.progress_percent} /> : null}
    </Link>
  )
}
