/** Build shareable catalog query params including language. */
export function catalogSearchParams(input: {
  language?: string
  category?: string
  level?: string
  page?: number
}): URLSearchParams {
  const params = new URLSearchParams()
  if (input.category) params.set('category', input.category)
  if (input.level) params.set('level', input.level)
  if (input.language) params.set('language', input.language)
  if (input.page && input.page > 1) params.set('page', String(input.page))
  return params
}
