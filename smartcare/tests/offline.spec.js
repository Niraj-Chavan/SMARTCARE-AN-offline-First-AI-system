import { test, expect } from '@playwright/test'

const APP_URL = process.env.PLAYWRIGHT_APP_URL || 'http://localhost:4173'

test.describe('Offline symptom check', () => {
  test('runs a full check offline without network failures', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: APP_URL,
    })
    const page = await context.newPage()

    const failedRequests = []
    page.on('requestfailed', (request) => {
      failedRequests.push(request.url())
    })

    await page.goto('/')

    await page.getByRole('button', { name: 'Continue' }).waitFor({ timeout: 15000 })

    await context.setOffline(true)

    await page.getByRole('button', { name: 'shortness of breath' }).click()
    await page.getByRole('button', { name: 'wheezing' }).click()

    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Check now' }).click()

    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible()

    const riskTier = page.getByText('High')
    await expect(riskTier).toBeVisible()

    expect(failedRequests).toEqual([])

    await context.close()
  })
})
