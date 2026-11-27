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
    <nav
      aria-label="Pagination"
      className="results-bar"
      style={{ justifyContent: 'center', marginTop: 28, gap: 12 }}
    >
      <button
        type="button"
        className="btn btn-sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <span className="meta num">
        {page} / {pages}
      </span>
      <button
        type="button"
        className="btn btn-sm"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </nav>
  )
}
