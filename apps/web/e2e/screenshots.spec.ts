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
  // Mock SFN + Lambda calls
  await page.route(/states\..+\.amazonaws\.com/, route =>
    route.fulfill({ status: 200, contentType: 'application/x-amz-json-1.0', body: JSON.stringify({ executionArn: 'arn:aws:states:us-east-1:123:execution:mock' }) })
  )
  await page.route(/lambda\..+\.amazonaws\.com/, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ StatusCode: 200, Payload: new TextEncoder().encode(JSON.stringify({ status: 'RUNNING', progress: 50 })) }) })
  )
}

async function navigateTo(page: any, path: string) {
  await page.evaluate((p: string) => {
    window.history.pushState({}, '', p)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

test.use({ viewport: { width: 1600, height: 900 } })

test('01 - landing page', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/e2e.html')
  await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
  await page.screenshot({ path: `${OUT}/01_landing_page.png`, fullPage: false })
})

test('02 - questionnaire step 1 (basics)', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/e2e.html')
  await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
  await navigateTo(page, '/questionnaire')
  await page.waitForSelector('text=Project Name', { timeout: 8000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/02_questionnaire_step1.png`, fullPage: false })
})

test('03 - questionnaire step 2 (technical)', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/e2e.html')
  await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
  await navigateTo(page, '/questionnaire')
  await page.waitForSelector('text=Project Name', { timeout: 8000 })
  // Fill step 1 basics to advance
  await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill('Flow Log Analyzer')
  await page.locator('textarea, input[name="description"]').first().fill('Serverless VPC flow log analysis with anomaly detection and dashboards.')
  const targetField = page.locator('input[name="target_users"], input[placeholder*="user" i]').first()
  if (await targetField.isVisible()) await targetField.fill('DevOps engineers and security analysts')
  // Click Next / Step 2
  await page.locator('button:has-text("Next")').first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/03_questionnaire_step2.png`, fullPage: false })
})

test('04 - questionnaire step 3 (preferences) with demo data', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/e2e.html')
  await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
  await navigateTo(page, '/questionnaire')
  await page.waitForSelector('text=Project Name', { timeout: 8000 })
  // Use the demo data button if available to skip to step 3
  const demoBtn = page.locator('button:has-text("Demo"), button:has-text("demo"), button:has-text("Fill Demo")')
  if (await demoBtn.count() > 0) {
    await demoBtn.first().click()
    await page.waitForTimeout(500)
  }
  await page.screenshot({ path: `${OUT}/04_questionnaire_step3.png`, fullPage: false })
})

test('05 - planning in progress', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/e2e.html')
  await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
  // Seed projectRequest so planning page has data to work with
  await page.evaluate(() => {
    sessionStorage.setItem('projectRequest', JSON.stringify({
      basics: { name: 'Flow Log Analyzer', description: 'Serverless VPC flow log analysis.', target_users: 'DevOps engineers', timeline: '1 week', budget: '$100-$500' },
      technical: { user_count: '1K-10K', growth_rate: 'Moderate', uptime: '99.9%' },
      preferences: { backend_language: 'Python', infrastructure: 'Serverless', cloud_provider: 'AWS' },
      review_count: 3,
    }))
  })
  await navigateTo(page, '/planning')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/05_planning.png`, fullPage: false })
})

test('06 - results overview', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/e2e.html')
  await page.waitForSelector('text=Project Planner AI', { timeout: 8000 })
  await navigateTo(page, '/results/e2e-plan-001')
  await page.waitForSelector('text=Flow Log Analyzer', { timeout: 8000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/06_results.png`, fullPage: false })
})
