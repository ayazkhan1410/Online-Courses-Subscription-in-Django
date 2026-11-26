export type StripeCard = {
  mount: (el: HTMLElement) => void
  unmount: () => void
  on: (
    event: 'change',
    cb: (ev: { error?: { message?: string } }) => void,
  ) => void
}

export type StripeClient = {
  elements: () => { create: (type: 'card') => StripeCard }
  createToken: (card: StripeCard) => Promise<{
    token?: { id: string }
    error?: { message: string }
  }>
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            ux_mode?: 'popup' | 'redirect'
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string
              size?: string
              text?: string
              shape?: string
              width?: number
            },
          ) => void
        }
      }
    }
    Stripe?: (key: string) => StripeClient
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string }) => string
      getResponse: (id: string) => string
      reset: (id: string) => void
    }
  }
}

export {}
