import { defineConfig, devices } from '@playwright/test'

const WEB_URL = process.env['E2E_WEB_URL'] ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Web server is NOT auto-started — boot both apps manually:
  //   bun run dev      (turbo runs api + web)
  //   bun run test:e2e (this runs against them)
  // CI will wire its own webServer block when we get there.
})
