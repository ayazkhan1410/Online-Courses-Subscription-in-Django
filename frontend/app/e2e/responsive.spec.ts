import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const pages = [
  '/',
  '/about',
  '/courses',
  '/paths',
  '/services',
  '/work',
  '/testimonials',
  '/contact',
  '/pricing',
  '/pro',
  '/faq',
  '/privacy',
  '/terms',
  '/search',
  '/login',
  '/register',
  '/forgot-password',
]

const widths = [360, 768, 1280]

test.beforeAll(() => {
  mkdirSync(join(process.cwd(), 'e2e', 'screenshots'), { recursive: true })
})

for (const width of widths) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    for (const path of pages) {
      const name = path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '-')
      test(`${path} has no horizontal scroll`, async ({ page }) => {
        await page.goto(path)
        await page.waitForLoadState('domcontentloaded')
        const box = await page.evaluate(() => ({
          scrollWidth: document.scrollingElement?.scrollWidth ?? document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }))
        expect(box.scrollWidth).toBeLessThanOrEqual(box.innerWidth + 1)
        await page.screenshot({
          path: `e2e/screenshots/${name}-${width}.png`,
          fullPage: true,
        })
      })
    }
  })
}

test('mobile menu sheet opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: /menu/i })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
