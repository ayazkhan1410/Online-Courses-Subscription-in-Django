import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { mfaConfirm, mfaDisable, mfaSetup, mfaStatus } from '@/api/mfa'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { Input } from '@/components/Input'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { accessFromAuth } from '@/lib/session'

function QrCode({ svg }: { svg: string }) {
  const clean = svg.trim()
  if (!clean.startsWith('<svg') || clean.toLowerCase().includes('<script')) return null
  return (
    <div
      className="max-w-xs bg-paper p-4 text-notebook-ink [&_svg]:h-auto [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}

export default function SecurityPage() {
  usePageTitle('Security')
  const { setSession, user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const status = useQuery({ queryKey: ['mfa-status'], queryFn: mfaStatus })
  const [qr, setQr] = useState<string>('')
  const [manual, setManual] = useState('')
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const setup = useMutation({
    mutationFn: mfaSetup,
    onSuccess: (data) => {
      setQr(data.qr_svg)
      setManual(data.manual_key)
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const confirm = useMutation({
    mutationFn: () => mfaConfirm(code),
    onSuccess: async (data) => {
      setCodes(data.recovery_codes)
      if (user) {
        setSession(
          accessFromAuth({ token: data.token, access: data.access, user }),
          user,
          data.refresh,
        )
      }
      setQr('')
      await queryClient.invalidateQueries({ queryKey: ['mfa-status'] })
      toast.push('Authenticator is on')
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const disable = useMutation({
    mutationFn: () => mfaDisable({ password, code: disableCode }),
    onSuccess: async (data) => {
      toast.push(data.message)
      setCodes([])
      await queryClient.invalidateQueries({ queryKey: ['mfa-status'] })
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  function downloadCodes() {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'recovery-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (status.isError) {
    return <ErrorState message={formatApiError(status.error)} onRetry={() => void status.refetch()} />
  }

  const enabled = Boolean(status.data?.enabled)

  return (
    <div className="max-w-xl">
      <h1 className="text-[32px]">Security</h1>
      <p className="mt-3 font-mono text-sm text-accent-ink">
        {status.isLoading ? 'Checking authenticator status' : enabled ? 'Authenticator is on' : 'Authenticator is off'}
      </p>
      {typeof status.data?.recovery_codes_remaining === 'number' ? (
        <p className="mt-2 text-sm text-ink-2">
          Recovery codes left: {status.data.recovery_codes_remaining}
        </p>
      ) : null}

      {!enabled && !qr ? (
        <Button className="mt-6" onClick={() => setup.mutate()} disabled={setup.isPending}>
          Set up authenticator
        </Button>
      ) : null}

      {qr ? (
        <div className="mt-6 flex flex-col gap-4">
          <QrCode svg={qr} />
          {manual ? <p className="font-mono text-sm">Manual key: {manual}</p> : null}
          <Input
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Button onClick={() => confirm.mutate()} disabled={code.length !== 6 || confirm.isPending}>
            Confirm
          </Button>
        </div>
      ) : null}

      {codes.length > 0 ? (
        <div className="mt-8">
          <p>Save these recovery codes. Each one works once.</p>
          <ul className="mt-4 font-mono text-sm">
            {codes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(codes.join('\n'))
                toast.push('Copied')
              }}
            >
              Copy codes
            </Button>
            <Button variant="ghost" onClick={downloadCodes}>
              Download
            </Button>
          </div>
        </div>
      ) : null}

      {enabled ? (
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            disable.mutate()
          }}
        >
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Input
            label="Or authenticator / recovery code"
            autoComplete="one-time-code"
            value={disableCode}
            onChange={(event) => setDisableCode(event.target.value)}
          />
          <Button type="submit" variant="ghost" disabled={disable.isPending}>
            Disable authenticator
          </Button>
        </form>
      ) : null}

      <p className="mt-8 text-sm">
        <Link to="/dashboard">Back to dashboard</Link>
      </p>
    </div>
  )
}
