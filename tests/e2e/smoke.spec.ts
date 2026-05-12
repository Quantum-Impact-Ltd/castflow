import { expect, test } from '@playwright/test'

test.describe('Smoke', () => {
  test('homepage loads', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBeLessThan(400)
  })

  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('auth-guarded route redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/artist/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
