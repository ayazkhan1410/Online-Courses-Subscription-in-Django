import { Keycap } from '@/components/Keycap'
import { Panel } from '@/components/Panel'

const ROWS: { keys: React.ReactNode; label: string }[] = [
  {
    keys: (
      <>
        <Keycap>K</Keycap>, <Keycap>Space</Keycap>
      </>
    ),
    label: 'Play or pause',
  },
  {
    keys: (
      <>
        <Keycap>J</Keycap> / <Keycap>L</Keycap>
      </>
    ),
    label: 'Back / forward 10 seconds',
  },
  { keys: <Keycap>M</Keycap>, label: 'Mark lesson complete' },
  { keys: <Keycap>N</Keycap>, label: 'New note at current time' },
  {
    keys: (
      <>
        <Keycap>Shift+N</Keycap> / <Keycap>Shift+P</Keycap>
      </>
    ),
    label: 'Next / previous lesson',
  },
  { keys: <Keycap>F</Keycap>, label: 'Focus mode' },
  { keys: <Keycap>?</Keycap>, label: 'This sheet' },
]

export function LearnShortcutsSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="learn-shortcuts-backdrop" role="presentation" onClick={onClose}>
      <div
        className="learn-shortcuts-sheet-wrap"
        role="dialog"
        aria-labelledby="learn-shortcuts-title"
        onClick={(event) => event.stopPropagation()}
      >
        <Panel className="learn-shortcuts-sheet">
          <div className="learn-shortcuts-head">
            <h2 id="learn-shortcuts-title" className="h3">
              Keyboard shortcuts
            </h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
          <ul className="learn-shortcuts-list">
            {ROWS.map((row) => (
              <li key={row.label}>
                <span className="learn-shortcuts-keys">{row.keys}</span>
                <span className="learn-shortcuts-label">{row.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}