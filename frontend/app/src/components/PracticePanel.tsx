import { useState } from 'react'
import { Panel } from '@/components/Panel'
import { parseMarkdownLite } from '@/lib/markdownLite'

export function PracticePanel({
  task,
  hint,
}: {
  task: string
  hint?: string
}) {
  const body = task.trim()
  if (!body) return null
  const [hintOpen, setHintOpen] = useState(false)
  const hasHint = Boolean(hint?.trim())

  return (
    <Panel className="practice-panel">
      <h2 className="h3">Try it yourself</h2>
      <div className="md-lite">{parseMarkdownLite(body)}</div>
      {hasHint ? (
        <div className="practice-hint">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-expanded={hintOpen}
            onClick={() => setHintOpen((open) => !open)}
          >
            {hintOpen ? 'Hide hint' : 'Show hint'}
          </button>
          {hintOpen ? (
            <div className="md-lite practice-hint-body">
              {parseMarkdownLite(hint!.trim())}
            </div>
          ) : null}
        </div>
      ) : null}
    </Panel>
  )
}