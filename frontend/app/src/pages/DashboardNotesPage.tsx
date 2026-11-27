import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { listAllNotes, type LessonNote } from '@/api/notes'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cleanLessonTitle } from '@/lib/lessonTitle'
import { formatClock } from '@/lib/resume'
import { stripEmoji } from '@/lib/text'

type Group = {
  courseSlug: string
  courseName: string
  lessons: Record<
    number,
    { lessonName: string; moduleId: number; notes: LessonNote[] }
  >
}

export default function DashboardNotesPage() {
  usePageTitle('Notes')
  const query = useQuery({ queryKey: ['notes', 'all'], queryFn: listAllNotes })

  if (query.isLoading) return <Skeleton className="h-40" />
  if (query.isError) {
    return (
      <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
    )
  }

  const notes = query.data ?? []
  const groups = new Map<string, Group>()
  for (const note of notes) {
    const slug = note.course_slug || 'course'
    let group = groups.get(slug)
    if (!group) {
      group = {
        courseSlug: slug,
        courseName: note.course_name || 'Course',
        lessons: {},
      }
      groups.set(slug, group)
    }
    const lesson = group.lessons[note.module] ?? {
      lessonName: note.lesson_name || 'Lesson',
      moduleId: note.module,
      notes: [],
    }
    lesson.notes.push(note)
    group.lessons[note.module] = lesson
  }

  return (
    <div>
      <h1 className="h1">Notes</h1>
      <p className="dim" style={{ marginTop: 8 }}>
        Timestamped notes from every lesson you write in.
      </p>
      {notes.length === 0 ? (
        <p className="dim" style={{ marginTop: 24 }}>
          No notes yet. Open a lesson and press N to write one at the current time.
        </p>
      ) : (
        <div style={{ marginTop: 24, display: 'grid', gap: 28 }}>
          {[...groups.values()].map((group) => (
            <section key={group.courseSlug}>
              <h2 className="h2">{stripEmoji(group.courseName)}</h2>
              <div style={{ marginTop: 12, display: 'grid', gap: 16 }}>
                {Object.values(group.lessons).map((lesson) => {
                  const cleaned = cleanLessonTitle(lesson.lessonName)
                  return (
                    <div key={lesson.moduleId}>
                      <h3 className="h3">{cleaned.title}</h3>
                      <ul className="note-list" style={{ marginTop: 8 }}>
                        {lesson.notes.map((note) => (
                          <li key={note.id}>
                            <Link
                              className="mono link"
                              to={`/learn/${group.courseSlug}/${lesson.moduleId}?t=${note.seconds}`}
                            >
                              {formatClock(note.seconds)}
                            </Link>
                            <span>{note.body}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
