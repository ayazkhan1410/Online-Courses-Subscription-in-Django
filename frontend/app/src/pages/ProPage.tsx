import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { getConfig } from '@/api/config'
import { becomePro, getPlans } from '@/api/membership'
import { getMe } from '@/api/auth'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { Select } from '@/components/Select'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { loadScript } from '@/lib/scripts'
import type { StripeCard, StripeClient } from '@/types/external'

export default function ProPage() {
  usePageTitle('Pro')
  const { token, user, setSession } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const mountRef = useRef<HTMLDivElement>(null)
  const stripeRef = useRef<StripeClient | null>(null)
  const cardRef = useRef<StripeCard | null>(null)
  const [membership, setMembership] = useState('')
  const [cardError, setCardError] = useState('')

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
    enabled: Boolean(token) && !user?.is_pro,
  })
  const config = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    enabled: Boolean(token) && !user?.is_pro,
  })

  const publishable = config.data?.stripe_publishable_key ?? ''

  useEffect(() => {
    const mount = mountRef.current
    if (!publishable || !mount) return
    let dead = false
    loadScript('https://js.stripe.com/v3/')
      .then(() => {
        if (dead || !window.Stripe || !mountRef.current) return
        const stripe = window.Stripe(publishable)
        stripeRef.current = stripe
        const card = stripe.elements().create('card')
        card.on('change', (event) => setCardError(event.error?.message ?? ''))
        card.mount(mountRef.current)
        cardRef.current = card
      })
      .catch(() => toast.push('Card field failed to load', 'err'))
    return () => {
      dead = true
      cardRef.current?.unmount()
      cardRef.current = null
    }
  }, [publishable, toast])

  const pay = useMutation({
    mutationFn: async () => {
      const stripe = stripeRef.current
      const card = cardRef.current
      if (!stripe || !card) throw new Error('Card field is not ready')
      const result = await stripe.createToken(card)
      if (result.error || !result.token) {
        throw new Error(result.error?.message || 'Card was not accepted')
      }
      return becomePro({
        membership: Number(membership),
        stripe_token: result.token.id,
      })
    },
    onSuccess: async () => {
      const next = await getMe()
      if (token) setSession(token, next)
      navigate('/payment/success')
    },
    onError: (error) => {
      toast.push(formatApiError(error), 'err')
      navigate('/payment/failed')
    },
  })

  if (!token) return <Navigate to="/login?next=%2Fpro" replace />

  return (
    <PageMain>
      <PageHeader
        title="Pro access for the full library"
        lead="Premium courses stay open while the membership is active."
      />
      {user?.is_pro ? (
        <EmptyState
          title="You already have Pro"
          body="Premium lessons are available on this account."
          actionLabel="Browse courses"
          to="/courses"
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="space-y-3 text-ink-2">
            <li>Premium course catalog without the lock.</li>
            <li>Lessons stay available while you are Pro.</li>
            <li>Checkout uses Stripe.</li>
          </ul>
          <form
            className="rounded-panel border border-line bg-surface p-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!membership) {
                toast.push('Choose a plan', 'err')
                return
              }
              pay.mutate()
            }}
          >
            <h2 className="text-xl">Choose a plan</h2>
            {plans.isError ? (
              <div className="mt-4">
                <ErrorState message={formatApiError(plans.error)} onRetry={() => void plans.refetch()} />
              </div>
            ) : null}
            {plans.data && plans.data.length === 0 ? (
              <p className="mt-4 text-sm text-ink-2">No plans are listed yet.</p>
            ) : null}
            {plans.data && plans.data.length > 0 ? (
              <div className="mt-4">
                <Select
                  label="Membership"
                  value={membership}
                  onChange={(event) => setMembership(event.target.value)}
                >
                  <option value="">Select a plan</option>
                  {plans.data.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.subscription_list} · {plan.subscription_price}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            <div className="mt-4">
              <p className="mb-2 text-sm text-ink-2">Card</p>
              <div ref={mountRef} className="rounded-control border border-line bg-bg p-3" />
              {cardError ? <p className="mt-2 text-sm text-err">{cardError}</p> : null}
            </div>
            <Button className="mt-6 w-full" type="submit" disabled={pay.isPending || !publishable}>
              Pay and activate Pro
            </Button>
            {!publishable && config.isSuccess ? (
              <p className="mt-3 text-sm text-ink-2">Stripe is not configured.</p>
            ) : null}
            <p className="mt-4 text-sm">
              <Link to="/pricing">Back to pricing</Link>
            </p>
          </form>
        </div>
      )}
    </PageMain>
  )
}
