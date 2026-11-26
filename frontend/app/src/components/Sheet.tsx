import type { ReactNode } from 'react'
import { Overlay } from '@/components/Overlay'

export function Sheet({
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
      panelClassName="relative z-10 ml-auto flex h-full w-full max-w-sm flex-col border-l border-line bg-surface p-6"
    >
      {children}
    </Overlay>
  )
}
