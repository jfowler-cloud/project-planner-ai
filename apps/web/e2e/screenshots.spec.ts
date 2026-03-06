/**
 * Screenshot capture spec — generates docs/images/ for the README.
 * Run with: npx playwright test e2e/screenshots.spec.ts
 */
import { test } from '@playwright/test'

const OUT = '/home/user/Desktop/Projects/project-planner-ai/docs/images'

// Mock the backend so rate-limit and plan fetch calls don't fail
async function mockBackend(page: any) {
  await page.route('**/api/v1/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  )
}

test.use({ viewport: { width: 1600, height: 900 } })

test('01 - landing page', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/e2e.html')
  await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
  await page.screenshot({ path: `${OUT}/landing_page.png`, fullPage: false })
})

test('02 - results overview', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/e2e.html')
  // sessionStorage is seeded in e2e-main.tsx — navigate directly to results
  await page.goto('http://localhost:4173/results/e2e-plan-001')
  await page.waitForSelector('text=Flow Log Analyzer', { timeout: 8000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/results.png`, fullPage: false })
})
