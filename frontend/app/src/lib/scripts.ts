const pending = new Map<string, Promise<void>>()

export function loadScript(src: string): Promise<void> {
  const existing = pending.get(src)
  if (existing) return existing
  const promise = new Promise<void>((resolve, reject) => {
    const found = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (found && found.dataset.loaded === '1') {
      resolve()
      return
    }
    const script = found ?? document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = '1'
      resolve()
    }
    script.onerror = () => {
      pending.delete(src)
      reject(new Error('Script failed to load'))
    }
    if (!found) document.head.appendChild(script)
  })
  pending.set(src, promise)
  return promise
}
