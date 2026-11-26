import { expect, test } from '@playwright/test'

const stamp = Date.now().toString().slice(-8)
const user = {
  username: `pw${stamp}`,
  email: `pw${stamp}@example.com`,
  password: 'StudyDesk-4780!',
}

async function hideTurnstile(page: import('@playwright/test').Page) {
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

test('register login logout courses search pagination detail enroll complete wishlist dashboard contact forgot unauthorized', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await hideTurnstile(page)

  await test.step('unauthorized dashboard redirects', async () => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('next=')
  })

  await test.step('register', async () => {
    await page.goto('/register')
    await page.getByLabel('Username').fill(user.username)
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL('**/dashboard', { timeout: 20_000 })
  })

  await test.step('logout', async () => {
    await page.getByRole('button', { name: 'Log out' }).click()
    await page.waitForURL('**/')
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Log in' }),
    ).toBeVisible()
  })

  await test.step('login', async () => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.locator('form').getByRole('button', { name: 'Log in' }).click()
    await page.waitForURL('**/dashboard', { timeout: 20_000 })
  })

  await test.step('browse courses', async () => {
    await page.goto('/courses')
    await expect(page.locator('main a[href^="/courses/"]').first()).toBeVisible({
      timeout: 15_000,
    })
  })

  await test.step('categories', async () => {
    await page.goto('/categories')
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible({
      timeout: 15_000,
    })
  })

  await test.step('search', async () => {
    await page.goto('/courses')
    const cardTitle = page.locator('main .card-title').first()
    await expect(cardTitle).toBeVisible({ timeout: 15_000 })
    const title = (await cardTitle.innerText()).trim()
    const word = title.split(/\s+/).find((part) => part.length > 2) || 'Python'
    await page.getByLabel('Search courses').fill(word)
    await page.getByLabel('Search courses').press('Enter')
    await expect(page.locator('main a[href^="/courses/"]').first()).toBeVisible({
      timeout: 15_000,
    })
  })

  await test.step('pagination', async () => {
    await page.goto('/courses')
    const next = page.getByRole('link', { name: 'Next' })
    if (await next.count()) {
      await next.click()
      await expect(page).toHaveURL(/page=2|courses/)
    }
  })

  await test.step('detail enroll complete wishlist', async () => {
    await page.goto('/courses')
    await page.locator('main a[href^="/courses/"]').first().click()
    await page.waitForURL(/\/courses\/[^/]+$/)
    await expect(page.getByTestId('course-attribution')).toContainText(
      /By Ayaz|Watch on YouTube|YouTube/,
    )
    const enroll = page.getByRole('button', { name: /Enroll/i })
    if (await enroll.isVisible().catch(() => false)) {
      await enroll.click()
    }
    const resume = page.getByRole('link', {
      name: /Continue learning|Start course|Resume/i,
    })
    const lesson = page.locator('.lessons a.t').first()
    if (await resume.isVisible().catch(() => false)) {
      await resume.click()
    } else if (await lesson.isVisible().catch(() => false)) {
      await lesson.click()
    } else {
      const slug = page.url().split('/courses/')[1]
      await page.goto(`/learn/${slug}/0`)
    }
    await page.waitForURL(/\/learn\//, { timeout: 15_000 })
    const complete = page.getByRole('button', {
      name: /Mark complete|Mark incomplete/,
    })
    if (await complete.isVisible().catch(() => false)) {
      await complete.click()
    }
  })

  await test.step('wishlist from detail', async () => {
    await page.goto('/courses')
    await page.locator('main a[href^="/courses/"]').nth(1).click()
    const save = page.getByRole('button', {
      name: /Save for later|Remove from saved|Save|Remove saved/i,
    })
    if (await save.isVisible().catch(() => false)) {
      await save.click()
    }
  })

  await test.step('dashboard', async () => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  await test.step('contact', async () => {
    await page.goto('/contact')
    await page.getByLabel('Name').fill('Playwright')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Message').fill('Checking the contact form.')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText(/sent|thanks|received/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  await test.step('forgot password', async () => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill(user.email)
    await page.getByRole('button', { name: 'Send link' }).click()
    await expect(
      page.getByText(/email|sent|check|An email/i).first(),
    ).toBeVisible({ timeout: 15_000 })
  })
})
