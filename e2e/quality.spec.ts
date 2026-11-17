// Quality on every page: no console errors (APP-13), under a second (APP-12), nothing but
// localhost (APP-3, APP-4), and no sideways scrolling at 1024px (APP-1).
import { api, expect, freshData, test } from './fixtures';

freshData();

const PAGES = ['/', '/pipeline', '/deals', '/organizations', '/contacts'];

async function recordPages(page: import('@playwright/test').Page) {
  const deals = await api<Array<{ id: number }>>(page, '/deals');
  const contacts = await api<Array<{ id: number }>>(page, '/contacts');
  const orgs = await api<Array<{ id: number }>>(page, '/organizations');
  return [`/deals/${deals[0]!.id}`, `/contacts/${contacts[0]!.id}`, `/organizations/${orgs[0]!.id}`];
}

test('[APP-13] no console errors on any page', async ({ page }) => {
  // The page fixture fails the test on any console error; this visits every screen.
  for (const path of [...PAGES, ...(await recordPages(page))]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('[APP-12] every page opens in under a second', async ({ page }) => {
  await page.goto('/'); // warm the browser cache, as on a second visit
  for (const path of [...PAGES, ...(await recordPages(page))]) {
    const start = Date.now();
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Loading…')).toHaveCount(0);
    const took = Date.now() - start;
    expect(took, `${path} took ${took}ms`).toBeLessThan(1000);
  }
});

test('[APP-12] moving between tabs is quick too', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const tab of ['Pipeline', 'Deals', 'Organizations', 'Contacts', 'Dashboard']) {
    const start = Date.now();
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: tab }).click();
    await expect(page.getByText('Loading…')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(Date.now() - start).toBeLessThan(1000);
  }
});

test('[APP-3] [APP-4] no request leaves localhost, and data comes only from /api', async ({ page }) => {
  const outside: string[] = [];
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:') outside.push(request.url());
    if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') apiCalls.push(url.pathname);
  });
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  expect(outside).toEqual([]);
  expect(apiCalls.length).toBeGreaterThan(0);
  expect(apiCalls.every((p) => p.startsWith('/api/'))).toBe(true);
});

test('[APP-4] fonts are served locally', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [
    document.fonts.check('14px "Instrument Sans"'),
    document.fonts.check('44px "Instrument Serif"'),
    document.fonts.check('34px "JetBrains Mono"'),
  ]);
  expect(loaded).toEqual([true, true, true]);
});

test('[APP-1] usable at 1024px with no sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  for (const path of [...PAGES, ...(await recordPages(page))]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sideways, `${path} scrolls sideways by ${sideways}px`).toBeLessThanOrEqual(0);
  }
});

test('[APP-1] designed for 1280px: the dashboard fits its four figures in one row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const figures = page.getByRole('region', { name: 'Key figures' }).locator('> *');
  await expect(figures).toHaveCount(4);
  const tops = await figures.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
  expect(new Set(tops).size).toBe(1);
});
