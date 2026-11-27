import { expect, test } from '@playwright/test'
import * as OTPAuth from 'otpauth'
import {
  fillOtp,
  hideTurnstile,
  registerAndVerify,
  waitForEmailCode,
} from './helpers'

function stampUser(prefix: string) {
  const stamp = `${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`
  return {
    username: `${prefix}${stamp}`.slice(0, 20),
    email: `${prefix}${stamp}@example.com`,
    password: 'StudyDesk-4780!',
  }
}

test.describe('Security two-step login', () => {
  test.setTimeout(180_000)

  test('email method: enable, login challenge, disable with password', async ({
    page,
  }) => {
    await hideTurnstile(page)
    const user = stampUser('em')
    await registerAndVerify(page, user)

    await page.goto('/dashboard/security')
    await expect(page.getByRole('heading', { name: 'Two-step login' })).toBeVisible()
    await expect(page.getByText(/^Off$/)).toBeVisible()
    await page.getByRole('button', { name: 'Email code' }).click()
    await expect(page.getByText(/6-digit code we emailed you/i)).toBeVisible({
      timeout: 15_000,
    })
    const setupCode = await waitForEmailCode(user.email)
    await fillOtp(page, setupCode)
    await expect(page.getByText(/On · Email code/i)).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: 'Log out' }).click()
    await page.waitForURL('**/')

    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.locator('form').getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('heading', { name: /Enter your code/i })).toBeVisible({
      timeout: 15_000,
    })
    const loginCode = await waitForEmailCode(user.email)
    await fillOtp(page, loginCode)
    await page.waitForURL('**/dashboard', { timeout: 20_000 })

    await page.goto('/dashboard/security')
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Turn off' }).click()
    await expect(page.getByText(/^Off$/)).toBeVisible({ timeout: 15_000 })
  })

  test('authenticator setup shows QR, manual key and 10 recovery codes', async ({
    page,
  }) => {
    await hideTurnstile(page)
    const user = stampUser('totp')
    await registerAndVerify(page, user)

    await page.goto('/dashboard/security')
    await expect(page.getByText(/^Off$/)).toBeVisible()
    await page.getByRole('button', { name: 'Authenticator app' }).click()
    const manual = page.locator('.mono.small').filter({ hasText: 'Manual key:' })
    await expect(manual).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.sec-qr svg')).toBeVisible({ timeout: 15_000 })
    const manualText = await manual.innerText()
    const manualKey = manualText.replace(/^Manual key:\s*/i, '').trim()
    expect(manualKey.length).toBeGreaterThan(10)

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(manualKey),
      digits: 6,
      period: 30,
    })
    await fillOtp(page, totp.generate())
    await expect(page.getByText(/Save these recovery codes/i)).toBeVisible({
      timeout: 15_000,
    })
    const codes = page.locator('.sec-block ul.mono li')
    await expect(codes).toHaveCount(10)
    await page.getByRole('button', { name: 'I saved them' }).click()
    await expect(page.getByText(/On · Authenticator app/i)).toBeVisible()
  })
})
