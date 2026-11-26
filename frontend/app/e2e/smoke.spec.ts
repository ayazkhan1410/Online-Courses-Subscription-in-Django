import { expect, test } from '@playwright/test'

test('home shows the desk headline', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse courses' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Hire me' })).toBeVisible()
  await page.screenshot({ path: 'e2e/screenshots/home.png', fullPage: true })
})

test('login has email and password', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await page.screenshot({ path: 'e2e/screenshots/login.png', fullPage: true })
})

test('courses page has search', async ({ page }) => {
  await page.goto('/courses')
  await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible()
  await expect(page.getByLabel('Search courses')).toBeVisible()
})
