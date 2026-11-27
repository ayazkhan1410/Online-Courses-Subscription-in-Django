/** Paragraphs and fenced ``` code blocks only. */
export function parseMarkdownLite(source: string): React.ReactNode[] {
  const trimmed = source.trim()
  if (!trimmed) return []

  const nodes: React.ReactNode[] = []
  const re = /```(\w*)\n?([\s\S]*?)```/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  const pushText = (text: string) => {
    const parts = text.split(/\n\n+/).filter(Boolean)
    for (const part of parts) {
      nodes.push(
        <p key={`p-${key++}`} className="md-lite-p">
          {part.split('\n').map((line, index) => (
            <span key={index}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </p>,
      )
    }
  }

  while ((match = re.exec(trimmed)) !== null) {
    if (match.index > last) {
      pushText(trimmed.slice(last, match.index))
    }
    const lang = match[1]
    const code = match[2].replace(/\n$/, '')
    nodes.push(
      <pre key={`pre-${key++}`} className="md-lite-pre" data-lang={lang || undefined}>
        <code>{code}</code>
      </pre>,
    )
    last = match.index + match[0].length
  }
  if (last < trimmed.length) {
    pushText(trimmed.slice(last))
  }
  return nodes
}