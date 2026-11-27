import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const pages = [
  '/',
  '/about',
  '/courses',
  '/paths',
  '/services',
  '/contact',
  '/categories',
  '/faq',
  '/privacy',
  '/terms',
  '/search',
  '/login',
  '/register',
  '/verify-email?email=demo%40example.com',
  '/forgot-password',
  '/this-page-does-not-exist-xyz',
]

const widths = [375, 768, 1440]
const themes = ['light', 'dark'] as const

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
          scrollWidth:
            document.scrollingElement?.scrollWidth ??
            document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }))
        expect(box.scrollWidth).toBeLessThanOrEqual(box.innerWidth + 1)
      })

      for (const theme of themes) {
        test(`${path} ${theme} screenshot`, async ({ page }) => {
          await page.addInitScript((next) => {
            localStorage.setItem('swa_theme', next)
            document.documentElement.setAttribute('data-theme', next)
          }, theme)
          await page.goto(path)
          await page.waitForLoadState('domcontentloaded')
          await page.screenshot({
            path: `e2e/screenshots/${name}-${width}-${theme}.png`,
            fullPage: true,
          })
        })
      }
    }
  })
}

test('mobile menu sheet opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: /menu/i })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
