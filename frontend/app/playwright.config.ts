import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  use: {
    baseURL: 'http://localhost:4780',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
})
