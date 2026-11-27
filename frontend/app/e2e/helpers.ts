import { expect, type Page } from '@playwright/test'

const API = process.env.E2E_API_BASE ?? 'http://localhost:4781/api'

export async function hideTurnstile(page: Page) {
  await page.route('**/api/config/', async (route) => {
    const response = await route.fetch()
    const json = await response.json()
    json.turnstile_site_key = ''
    await route.fulfill({
      status: response.status(),
      contentType: 'application/json',
      body: JSON.stringify(json),
    })
  })
}

export async function waitForEmailCode(email: string, attempts = 30): Promise<string> {
  let lastStatus = 0
  for (let i = 0; i < attempts; i += 1) {
    const response = await fetch(
      `${API}/test/last-email/?email=${encodeURIComponent(email)}`,
    )
    lastStatus = response.status
    if (response.ok) {
      const data = (await response.json()) as { code?: string | null }
      if (data.code && /^\d{6}$/.test(data.code)) return data.code
    }
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  throw new Error(`No email code for ${email} (last status ${lastStatus})`)
}

export async function fillOtp(page: Page, code: string) {
  const first = page.getByLabel('Digit 1')
  await expect(first).toBeVisible()
  await first.click()
  await page.evaluate((value) => {
    const input = document.querySelector(
      'input[aria-label="Digit 1"]',
    ) as HTMLInputElement | null
    if (!input) throw new Error('OTP digit 1 missing')
    input.focus()
    const transfer = new DataTransfer()
    transfer.setData('text', value)
    input.dispatchEvent(
      new ClipboardEvent('paste', {
        clipboardData: transfer,
        bubbles: true,
        cancelable: true,
      }),
    )
  }, code)
}

export async function registerAndVerify(
  page: Page,
  user: { username: string; email: string; password: string },
) {
  await page.goto('/register')
  await page.getByLabel('Username').fill(user.username)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL(/\/verify-email/)
  const code = await waitForEmailCode(user.email)
  await fillOtp(page, code)
  await page.waitForURL('**/dashboard', { timeout: 20_000 })
  await expect(page).toHaveURL(/\/dashboard/)
}
