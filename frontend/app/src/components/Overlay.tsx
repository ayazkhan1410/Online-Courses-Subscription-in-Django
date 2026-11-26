import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

function useDialog(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const root = panelRef.current
    if (!root) return
    const previously = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    document.documentElement.setAttribute('data-scroll-lock', '')
    const selector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    const focusable = () =>
      Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute('disabled'),
      )
    focusable()[0]?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.removeAttribute('data-scroll-lock')
      previously?.focus()
    }
  }, [open, panelRef])
}

export function Overlay({
  open,
  title,
  onClose,
  children,
  panelClassName,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  panelClassName: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useDialog(open, onClose, panelRef)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex bg-[rgba(31,27,22,0.4)]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClassName}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-2xl">
            {title}
          </h2>
          <button type="button" className="text-sm text-ink-2" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
