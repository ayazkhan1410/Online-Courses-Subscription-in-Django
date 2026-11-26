import type { ReactNode } from 'react'
import { Overlay } from '@/components/Overlay'

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <Overlay
      open={open}
      title={title}
      onClose={onClose}
      panelClassName="relative z-10 m-auto w-full max-w-lg rounded-panel border border-line bg-surface p-6"
    >
      {children}
    </Overlay>
  )
}
