import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PLAYWRIGHT_PORT || 4173
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${PORT}`,
    port: Number(PORT),
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
