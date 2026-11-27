import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const shotDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'screenshots',
)

async function noHorizontalScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  })
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
}

test.describe('home redesign', () => {
  test('hero text before delayed API; thumbs; no h-scroll; screenshots', async ({
    page,
  }) => {
    test.setTimeout(120_000)

    await page.route('**/api/config/', async (route) => {
      await new Promise((r) => setTimeout(r, 1200))
      try {
        const response = await route.fetch()
        const json = await response.json()
        json.turnstile_site_key = ''
        await route.fulfill({
          status: response.status(),
          contentType: 'application/json',
          body: JSON.stringify(json),
        })
      } catch {
        // Test may finish while the delayed fulfill is still in flight.
      }
    })

    await page.goto('/')

    const hero = page.locator('h1').first()
    await expect(hero).toBeVisible({ timeout: 5_000 })
    await expect(hero).toContainText('Learn to code from YouTube')

    await expect(page.locator('.home-band b').first()).not.toHaveText('—', {
      timeout: 20_000,
    })
    await expect(page.locator('.home-wall img').first()).toBeVisible({
      timeout: 20_000,
    })

    await page.setViewportSize({ width: 375, height: 812 })
    await noHorizontalScroll(page)

    await page.setViewportSize({ width: 1440, height: 900 })
    await noHorizontalScroll(page)

    await page.emulateMedia({ colorScheme: 'light' })
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light')
    })
    await page.screenshot({
      path: path.join(shotDir, 'home-light.png'),
      fullPage: true,
    })

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark')
    })
    await page.screenshot({
      path: path.join(shotDir, 'home-dark.png'),
      fullPage: true,
    })

    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })
})
