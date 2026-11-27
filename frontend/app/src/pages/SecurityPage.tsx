import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import {
  mfaConfirm,
  mfaConfirmEmail,
  mfaDisable,
  mfaSetup,
  mfaSetupEmail,
  mfaStatus,
} from '@/api/mfa'
import { OtpInput } from '@/components/OtpInput'
import { ErrorState } from '@/components/ErrorState'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { accessFromAuth } from '@/lib/session'

function QrCode({ svg }: { svg: string }) {
  const clean = svg.trim()
  if (!clean.startsWith('<svg') || clean.toLowerCase().includes('<script')) return null
  return (
    <div
      className="sec-qr"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}

type SetupMode = 'idle' | 'totp' | 'email'

export default function SecurityPage() {
  usePageTitle('Security')
  const { setSession, user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const status = useQuery({ queryKey: ['mfa-status'], queryFn: mfaStatus })
  const [mode, setMode] = useState<SetupMode>('idle')
  const [qr, setQr] = useState('')
  const [manual, setManual] = useState('')
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const setup = useMutation({
    mutationFn: mfaSetup,
    onSuccess: (data) => {
      setMode('totp')
      setQr(data.qr_svg)
      setManual(data.manual_key)
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const setupEmail = useMutation({
    mutationFn: mfaSetupEmail,
    onSuccess: (data) => {
      setMode('email')
      toast.push(data.message)
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const confirmTotp = useMutation({
    mutationFn: () => mfaConfirm(code),
    onSuccess: async (data) => {
      if (data.recovery_codes?.length) setCodes(data.recovery_codes)
      if (user && (data.token || data.access)) {
        setSession(
          accessFromAuth({ token: data.token ?? '', access: data.access, user }),
          user,
          data.refresh,
        )
      }
      setQr('')
      setMode('idle')
      setCode('')
      await queryClient.invalidateQueries({ queryKey: ['mfa-status'] })
      toast.push('Authenticator is on')
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const confirmEmail = useMutation({
    mutationFn: () => mfaConfirmEmail(code),
    onSuccess: async () => {
      setMode('idle')
      setCode('')
      await queryClient.invalidateQueries({ queryKey: ['mfa-status'] })
      toast.push('Email code is on')
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const disable = useMutation({
    mutationFn: () => mfaDisable({ password, code: disableCode }),
    onSuccess: async (data) => {
      toast.push(data.message)
      setCodes([])
      setPassword('')
      setDisableCode('')
      setMode('idle')
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
  const activeMethod = status.data?.method || status.data?.methods?.[0]
  const hasTotp = activeMethod === 'totp'
  const settingUp = mode === 'totp' || mode === 'email'

  return (
    <div className="sec-page">
      <h1 className="h2">Two-step login</h1>
      <p className="dim" style={{ marginTop: 8, maxWidth: '36rem' }}>
        Ask for a code when you log in with your email and password. Choose an authenticator app
        or a code sent to your email.
      </p>
      <p className="small dim" style={{ marginTop: 16, maxWidth: '36rem' }}>
        When you continue with Google, Google protects your sign-in, so we don&apos;t ask for a
        code.
      </p>

      {status.isLoading ? (
        <p className="meta" style={{ marginTop: 24 }}>
          Checking status
        </p>
      ) : (
        <p className="meta" style={{ marginTop: 24 }}>
          {enabled
            ? `On · ${activeMethod === 'email' ? 'Email code' : 'Authenticator app'}`
            : 'Off'}
        </p>
      )}

      {enabled && hasTotp && typeof status.data?.recovery_codes_remaining === 'number' ? (
        <p className="small dim" style={{ marginTop: 8 }}>
          Recovery codes left: {status.data.recovery_codes_remaining}
        </p>
      ) : null}

      {!enabled && !settingUp && codes.length === 0 ? (
        <div className="hero-actions" style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setup.mutate()}
            disabled={setup.isPending}
          >
            Authenticator app
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setupEmail.mutate()}
            disabled={setupEmail.isPending}
          >
            Email code
          </button>
        </div>
      ) : null}

      {mode === 'totp' && qr ? (
        <div className="sec-block">
          <QrCode svg={qr} />
          {manual ? <p className="mono small">Manual key: {manual}</p> : null}
          <p className="dim small">Enter the 6-digit code from your app to finish setup.</p>
          <OtpInput
            value={code}
            onChange={(next) => {
              setCode(next)
              if (next.length === 6) confirmTotp.mutate()
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => confirmTotp.mutate()}
            disabled={code.length !== 6 || confirmTotp.isPending}
          >
            Confirm
          </button>
        </div>
      ) : null}

      {mode === 'email' ? (
        <div className="sec-block">
          <p className="dim small">Enter the 6-digit code we emailed you.</p>
          <OtpInput
            value={code}
            onChange={(next) => {
              setCode(next)
              if (next.length === 6) confirmEmail.mutate()
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => confirmEmail.mutate()}
            disabled={code.length !== 6 || confirmEmail.isPending}
          >
            Confirm
          </button>
        </div>
      ) : null}

      {codes.length > 0 ? (
        <div className="sec-block">
          <p>Save these recovery codes. Each one works once.</p>
          <ul className="mono small" style={{ listStyle: 'none', padding: 0, margin: '16px 0' }}>
            {codes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="hero-actions">
            <button type="button" className="btn btn-ghost" onClick={downloadCodes}>
              Download
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setCodes([])
                toast.push('Saved')
              }}
            >
              I saved them
            </button>
          </div>
        </div>
      ) : null}

      {enabled ? (
        <form
          className="sec-block"
          onSubmit={(event) => {
            event.preventDefault()
            disable.mutate()
          }}
        >
          <h2 className="h3">Turn off two-step login</h2>
          <p className="dim small">Enter your password to turn this off.</p>
          <label className="field">
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="label">Or code from your current method</span>
            <input
              className="input"
              autoComplete="one-time-code"
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-ghost" disabled={disable.isPending}>
            Turn off
          </button>
        </form>
      ) : null}

      <p className="small" style={{ marginTop: 32 }}>
        <Link className="link" to="/dashboard">
          Back to dashboard
        </Link>
      </p>
    </div>
  )
}