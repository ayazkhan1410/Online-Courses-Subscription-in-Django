import { useRef } from 'react'

export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string
  onChange: (next: string) => void
  length?: number
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function setAt(index: number, char: string) {
    const next = digits.slice()
    next[index] = char
    onChange(next.join('').slice(0, length))
  }

  function onKeyDown(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
      setAt(index - 1, '')
    }
  }

  function onPaste(text: string) {
    const cleaned = text.replace(/\D/g, '').slice(0, length)
    if (!cleaned) return
    onChange(cleaned.padEnd(length, '').slice(0, length).replace(/ /g, ''))
    const focusAt = Math.min(cleaned.length, length - 1)
    refs.current[focusAt]?.focus()
  }

  const mid = Math.floor(length / 2)

  return (
    <div className="otp" role="group" aria-label={`${length}-digit code`}>
      {digits.map((digit, index) => (
        <span key={index} style={{ display: 'contents' }}>
          {index === mid ? <span /> : null}
          <input
            ref={(el) => {
              refs.current[index] = el
            }}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
            value={digit}
            onChange={(event) => {
              const raw = event.target.value.replace(/\D/g, '')
              if (raw.length > 1) {
                onPaste(raw)
                return
              }
              setAt(index, raw.slice(-1))
              if (raw && index < length - 1) refs.current[index + 1]?.focus()
            }}
            onKeyDown={(event) => onKeyDown(index, event.key)}
            onPaste={(event) => {
              event.preventDefault()
              onPaste(event.clipboardData.getData('text'))
            }}
          />
        </span>
      ))}
    </div>
  )
}
