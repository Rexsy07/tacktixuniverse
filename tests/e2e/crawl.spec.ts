import { test, expect } from '@playwright/test'

// Utility to normalize internal URL paths (ignore hash and search by default)
function normalizePath(href: string): string | null {
  try {
    const url = new URL(href, 'http://localhost:8080')
    if (url.origin !== 'http://localhost:8080') return null
    // Keep pathname only to avoid infinite loops due to search/hash
    return url.pathname.replace(/\/$/, '') || '/'
  } catch {
    return null
  }
}

// Determine if an element is likely safe and actionable to click
async function isActionable(locator: ReturnType<typeof test['info']>['project'] extends never ? any : any) {
  try {
    // These Playwright methods exist on Locator; using minimal guards to avoid throwing
    // @ts-ignore
    const visible = await locator.isVisible()
    // @ts-ignore
    const disabled = await locator.isDisabled?.().catch(() => false)
    return visible && !disabled
  } catch {
    return false
  }
}

test('crawl all internal routes and click visible buttons', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('baseURL not configured')

  const origin = baseURL.replace(/\/$/, '')
  const queue: string[] = ['/']
  const visited = new Set<string>()
  const failures: { route: string; elementHtml: string; error: string }[] = []

  // Helper to collect internal links on current page
  async function collectLinks(): Promise<string[]> {
    const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => (a as HTMLAnchorElement).href))
    const paths = new Set<string>()
    for (const href of hrefs) {
      try {
        const u = new URL(href)
        if (u.origin === origin) {
          const norm = (u.pathname.replace(/\/$/, '') || '/')
          paths.add(norm)
        }
      } catch {
        // ignore
      }
    }
    return [...paths]
  }

  while (queue.length) {
    const path = queue.shift()!
    if (visited.has(path)) continue
    visited.add(path)

    await page.goto(path, { waitUntil: 'networkidle' })

    // Enqueue newly found links
    const newLinks = await collectLinks()
    for (const l of newLinks) {
      if (!visited.has(l) && !queue.includes(l)) queue.push(l)
    }

    // Find actionable elements
    const selectors = [
      'button:not([disabled])',
      '[role="button"]',
      'a[href]',
      'input[type="button"]',
      'input[type="submit"]',
    ].join(', ')

    const els = page.locator(selectors)
    const count = await els.count()

    for (let i = 0; i < count; i++) {
      const el = els.nth(i)
      if (!(await isActionable(el))) continue

      // Dismiss any dialogs that may appear
      const offDialog = page.once('dialog', (d) => d.dismiss().catch(() => {}))

      // Try clicking, allow for navigation or popups w/o failing
      const beforeUrl = page.url()
      try {
        await Promise.race([
          el.click({ timeout: 5000 }),
          page.waitForEvent('popup', { timeout: 5000 }).then((p) => p.close().catch(() => {})),
        ])

        // If we navigated, wait for network to settle, then go back to the route we were testing
        const afterUrl = page.url()
        if (afterUrl !== beforeUrl) {
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
          // Navigate back to the route under test to continue clicking others
          await page.goto(path, { waitUntil: 'networkidle' })
        }
      } catch (e: any) {
        const html = await el.evaluate((node) => (node as HTMLElement).outerHTML).catch(() => '<unknown>')
        failures.push({ route: path, elementHtml: html, error: String(e?.message || e) })
        // Try to recover context
        if (page.url() !== origin + path) {
          await page.goto(path, { waitUntil: 'networkidle' }).catch(() => {})
        }
      } finally {
        // @ts-ignore
        typeof offDialog === 'function' && offDialog()
      }
    }
  }

  // Provide a readable assertion summary
  if (failures.length) {
    console.error('\nClick failures:')
    for (const f of failures) {
      console.error(`- [${f.route}] ${f.error} | element: ${f.elementHtml.slice(0, 120)}...`)
    }
  }

  expect(failures, 'All visible, enabled buttons should be clickable without errors').toHaveLength(0)
})