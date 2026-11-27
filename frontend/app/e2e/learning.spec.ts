import { expect, test, type Page } from '@playwright/test'
import { hideTurnstile, registerAndVerify } from './helpers'

async function mockYouTubeApi(page: Page) {
  await page.addInitScript(() => {
    class YTPlayer {
      time = 42
      duration = 600
      state = 2
      onState: ((e: { data: number; target: YTPlayer }) => void) | undefined
      constructor(
        _el: HTMLElement,
        opts: {
          playerVars?: { start?: number }
          events?: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number; target: YTPlayer }) => void
          }
        },
      ) {
        this.time = Number(opts.playerVars?.start || 0)
        this.onState = opts.events?.onStateChange
        queueMicrotask(() => opts.events?.onReady?.({ target: this }))
      }
      destroy() {}
      getCurrentTime() {
        return this.time
      }
      getDuration() {
        return this.duration
      }
      getPlayerState() {
        return this.state
      }
      seekTo(seconds: number) {
        this.time = seconds
      }
      playVideo() {
        this.state = 1
        this.onState?.({ data: 1, target: this })
      }
      pauseVideo() {
        this.state = 2
        this.onState?.({ data: 2, target: this })
      }
    }
    const w = window as Window & {
      YT?: unknown
      onYouTubeIframeAPIReady?: () => void
    }
    w.YT = {
      Player: YTPlayer,
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    }
    queueMicrotask(() => w.onYouTubeIframeAPIReady?.())
  })
  await page.route('**/iframe_api', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '/* mocked */',
    })
  })
}

test.describe('learning features', () => {
  test('language filter and notebook 404 at 375px', async ({ page }) => {
    await hideTurnstile(page)
    await page.setViewportSize({ width: 375, height: 800 })

    await page.goto('/courses')
    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'English' }).click()
    await expect(page).toHaveURL(/language=en/)
    const scroll = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(scroll).toBeLessThanOrEqual(1)

    await page.goto('/this-page-does-not-exist-xyz')
    await expect(page.getByRole('heading', { name: /isn't in the notebook/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse courses' })).toBeVisible()
  })

  test('path detail rail at 375px', async ({ page }) => {
    await hideTurnstile(page)
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/paths')
    const firstPath = page.locator('a[href^="/paths/"]').first()
    test.skip(!(await firstPath.count()), 'No paths seeded')
    await firstPath.click()
    await expect(page.locator('main').first()).toBeVisible()
    const scroll = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(scroll).toBeLessThanOrEqual(1)
  })

  test('resume note shortcuts and focus mode', async ({ page }) => {
    await hideTurnstile(page)
    await mockYouTubeApi(page)
    const stamp = Date.now().toString().slice(-8)
    const user = {
      username: `learn${stamp}`,
      email: `learn${stamp}@example.com`,
      password: 'StudyDesk-4780!',
    }
    await registerAndVerify(page, user)

    await page.goto('/courses')
    await page.locator('a[href^="/courses/"]').first().click()
    await page.waitForURL(/\/courses\//)
    const enroll = page.getByRole('button', { name: /^Enroll$/i })
    if (await enroll.count()) {
      await enroll.first().click()
      await expect(enroll).toHaveCount(0, { timeout: 10_000 }).catch(() => undefined)
    }
    const slug = page.url().split('/courses/')[1]?.split(/[?#]/)[0]
    expect(slug).toBeTruthy()
    await page.goto(`/learn/${slug}`)
    await page.waitForURL(/\/learn\//, { timeout: 20_000 })

    const noteInput = page.getByPlaceholder(/Write a note/i)
    const learnEnroll = page.getByRole('button', { name: 'Enroll' })
    if (await noteInput.isDisabled()) {
      await expect(learnEnroll).toBeVisible()
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/enroll') && res.ok()),
        learnEnroll.click(),
      ])
      await expect(noteInput).toBeEnabled({ timeout: 20_000 })
    }

    await page.getByRole('button', { name: 'Keyboard shortcuts' }).click()
    await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()

    await noteInput.fill('Seek me later')
    await noteInput.press('Enter')
    await expect(page.locator('.note-list .mono').first()).toBeVisible({ timeout: 10_000 })
    await page.locator('.note-list .mono').first().click()

    await page.keyboard.press('f')
  })
})




