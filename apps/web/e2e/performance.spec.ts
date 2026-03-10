import { test, expect } from '@playwright/test'

async function mockBackend(page: any) {
  await page.route('**/api/v1/**', (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  )
}

test.describe('Performance Baselines', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page)
  })

  test('home page loads within performance budget', async ({ page }) => {
    await page.goto('/e2e.html')
    await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: nav.domContentLoadedEventEnd,
        loadComplete: nav.loadEventEnd,
        ttfb: nav.responseStart - nav.requestStart,
      }
    })

    expect(metrics.domContentLoaded).toBeLessThan(3000)
    expect(metrics.loadComplete).toBeLessThan(5000)
  })
})
