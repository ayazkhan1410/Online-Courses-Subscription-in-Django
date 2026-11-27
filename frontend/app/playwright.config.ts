import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:4780',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
    // Prefer system Chrome when Playwright's bundled browser is missing.
    channel: 'chrome',
  },
})
