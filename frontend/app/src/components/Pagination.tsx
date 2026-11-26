import { Button } from '@/components/Button'

export function pageCount(count: number, size = 8): number {
  if (count <= 0) return 1
  return Math.ceil(count / size)
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number
  pages: number
  onPage: (page: number) => void
}) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <p className="font-mono text-sm tabular-nums text-ink-2">
        {page} / {pages}
      </p>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </nav>
  )
}
