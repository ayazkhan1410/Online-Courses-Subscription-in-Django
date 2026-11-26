import type { ReactNode } from 'react'

export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="mb-8">
      <h1>{title}</h1>
      {lead ? <p className="mt-3 max-w-2xl text-lg text-ink-2">{lead}</p> : null}
    </header>
  )
}

export function PageMain({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
      {children}
    </div>
  )
}

export function AuthSplit({
  title,
  lead,
  children,
}: {
  title: string
  lead: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-[70vh] md:grid-cols-2">
      <div className="flex items-center px-4 py-16 md:px-10">
        <div className="w-full max-w-[400px]">
          <h1>{title}</h1>
          <p className="mt-3 text-ink-2">{lead}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <aside className="hidden items-center bg-paper px-10 text-notebook-ink md:flex">
        <div className="max-w-sm">
          <p className="font-mono text-sm text-accent-ink">Lesson 01 / 50</p>
          <pre className="mt-6 font-mono text-sm leading-7">{`def greet(name):
    return f"Hello, {name}"`}</pre>
          <p className="mt-6 text-sm">A sample from the Python desk notes.</p>
        </div>
      </aside>
    </div>
  )
}
