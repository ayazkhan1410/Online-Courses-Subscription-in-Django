import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { suggestPlaylist } from '@/api/playlistSuggest'
import { ApiError, formatApiError } from '@/api/client'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { useToast } from '@/components/Toast'
import { playlistSuggestSchema, type PlaylistSuggestValues } from '@/lib/schemas'

export function PlaylistSuggestPanel() {
  const toast = useToast()
  const [duplicateCourse, setDuplicateCourse] = useState<{
    detail: string
    path: string
  } | null>(null)
  const form = useForm<PlaylistSuggestValues>({
    resolver: zodResolver(playlistSuggestSchema),
    defaultValues: { url: '', note: '', email: '' },
  })

  async function onSubmit(values: PlaylistSuggestValues) {
    setDuplicateCourse(null)
    try {
      await suggestPlaylist({
        url: values.url.trim(),
        note: values.note.trim(),
        email: values.email?.trim() || undefined,
      })
      toast.push('Thanks — we will review it.')
      form.reset()
    } catch (error) {
      const duplicate = parseDuplicateCourse(error)
      if (duplicate) {
        setDuplicateCourse(duplicate)
        form.setError('url', { message: duplicate.detail })
        return
      }
      toast.push(formatApiError(error), 'err')
    }
  }

  return (
    <section className="section">
      <div className="panel" style={{ padding: 24, maxWidth: '36rem' }}>
        <h2 className="h2" style={{ marginBottom: 8 }}>
          Know a free playlist that belongs here?
        </h2>
        <p className="dim small" style={{ marginBottom: 16 }}>
          Send a public YouTube playlist link. We check it is free to watch and fits the
          catalog.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            void form.handleSubmit(onSubmit)(event)
          }}
        >
          <Input
            label="Playlist URL"
            type="url"
            placeholder="https://www.youtube.com/playlist?list=…"
            error={form.formState.errors.url?.message}
            {...form.register('url', {
              onChange: () => setDuplicateCourse(null),
            })}
          />
          {duplicateCourse ? (
            <p className="text-sm">
              <Link className="link" to={duplicateCourse.path}>
                View course in the catalog
              </Link>
            </p>
          ) : null}
          <Textarea
            label="Why it fits"
            placeholder="Topic, language, who it helps…"
            error={form.formState.errors.note?.message}
            {...form.register('note')}
          />
          <Input
            label="Email (optional)"
            type="email"
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Suggest playlist
          </Button>
        </form>
      </div>
    </section>
  )
}

function parseDuplicateCourse(
  error: unknown,
): { detail: string; path: string } | null {
  if (!(error instanceof ApiError)) {
    return null
  }
  const body = error.data
  if (!body || typeof body !== 'object' || !('url' in body)) {
    return null
  }
  const urlField = (body as Record<string, unknown>).url
  if (!urlField || typeof urlField !== 'object') {
    return null
  }
  const record = urlField as Record<string, unknown>
  const slug = typeof record.course_slug === 'string' ? record.course_slug : ''
  const detail = typeof record.detail === 'string' ? record.detail : 'Already listed.'
  if (!slug) {
    return null
  }
  return { detail, path: `/courses/${slug}` }
}