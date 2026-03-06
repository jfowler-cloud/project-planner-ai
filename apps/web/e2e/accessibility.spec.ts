import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function mockBackend(page: any) {
  await page.route('**/api/v1/**', (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  )
}

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page)
  })

  test('Home page has no accessibility violations', async ({ page }) => {
    await page.goto('/e2e.html')
    await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('Questionnaire step 1 has no accessibility violations', async ({ page }) => {
    await page.goto('/e2e.html')
    await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
    await page.getByRole('button', { name: /start|begin|get started/i }).first().click()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})
