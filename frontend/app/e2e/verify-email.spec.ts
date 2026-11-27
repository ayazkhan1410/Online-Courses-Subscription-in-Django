import { expect, test } from '@playwright/test'

test('verify email page layout at 375px', async ({ page }) => {
  await page.goto('/verify-email?email=demo%40example.com')
  await page.waitForLoadState('domcontentloaded')
  const box = await page.evaluate(() => ({
    scrollWidth:
      document.scrollingElement?.scrollWidth ?? document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(box.scrollWidth).toBeLessThanOrEqual(box.innerWidth + 1)
  await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()
})

test('register can route to verify when API requires it', async ({ page }) => {
  await page.route('**/api/auth/register/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ verification_required: true, email: 'mock@example.com' }),
    })
  })
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
  await page.goto('/register')
  await page.getByLabel('Username').fill('mockuser')
  await page.getByLabel('Email').fill('mock@example.com')
  await page.getByLabel('Password').fill('StudyDesk-4780!')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL(/\/verify-email\?email=/)
  await expect(page.getByText('mock@example.com')).toBeVisible()
})