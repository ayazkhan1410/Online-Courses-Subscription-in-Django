import { expect, test } from '@playwright/test'

test('mobile menu opens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Courses' })).toBeVisible()
  await page.screenshot({ path: 'e2e/screenshots/mobile-nav.png', fullPage: true })
})

test('desktop nav shows the primary links', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav.getByRole('link', { name: 'Paths' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Work' })).toBeVisible()
  await page.screenshot({ path: 'e2e/screenshots/desktop-nav.png', fullPage: true })
})
