// The dashboard (DASH-1, DASH-3 to DASH-7, DASH-9 to DASH-11, DASH-13).
import { api, expect, freshData, money, test } from './fixtures';

freshData();

interface Dashboard {
  open_pipeline: { value: number; count: number };
  expected_revenue: { value: number; share: number };
  won_this_month: { value: number; change: number };
  late_deals: { count: number; value: number };
  follow_ups: { overdue: number; items: Array<{ description: string; follow_up_status: string }> };
  recent_activity: Array<{ description: string }>;
}

test('lands on the dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Good (morning|afternoon|evening)\./);
  await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('[DASH-1] [DASH-3] [DASH-4] [DASH-5] [DASH-6] the figures match the API', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', (r) => r.url().includes('/api/') && calls.push(new URL(r.url()).pathname));
  await page.goto('/');
  const data = await api<Dashboard>(page, '/dashboard');
  await expect(page.getByTestId('figure-open-pipeline')).toContainText(money(data.open_pipeline.value));
  await expect(page.getByTestId('figure-open-pipeline')).toContainText(`${data.open_pipeline.count} open deals`);
  await expect(page.getByTestId('figure-expected')).toContainText(money(data.expected_revenue.value));
  await expect(page.getByTestId('figure-expected')).toContainText(`${data.expected_revenue.share}% of the open pipeline`);
  await expect(page.getByTestId('figure-won')).toContainText(money(data.won_this_month.value));
  await expect(page.getByTestId('figure-won')).toContainText(`${data.won_this_month.change >= 0 ? '+' : '-'}US$`);
  await expect(page.getByTestId('figure-late')).toContainText(String(data.late_deals.count));
  await expect(page.getByTestId('figure-late')).toContainText(money(data.late_deals.value));
  expect(calls.filter((p) => p !== '/api/dashboard' && !['/api/deals', '/api/contacts', '/api/organizations'].includes(p))).toEqual([]);
  expect(calls.filter((p) => p === '/api/dashboard').length).toBe(1); // one call for every figure
});

test('[DASH-6] the late figure opens the deals filtered to late ones', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('figure-late').click();
  await expect(page).toHaveURL(/\/deals\?late=1$/);
  await expect(page.locator('main tbody tr')).toHaveCount(2);
});

test('[DASH-7] the revenue line shows a Midnight tooltip with the month and amount', async ({ page }) => {
  await page.goto('/');
  const chart = page.getByTestId('revenue-chart');
  const box = (await chart.boundingBox())!;
  await page.mouse.move(box.x + box.width - 30, box.y + box.height / 2);
  const tooltip = chart.getByRole('status');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(/(January|February|March|April|May|June|July|August|September|October|November|December)/);
  await expect(tooltip).toContainText(/US\$[\d,]+/);
  await expect(tooltip).toHaveCSS('background-color', 'rgb(7, 59, 76)');
});

test('[DASH-10] the deals won bars show a tooltip too', async ({ page }) => {
  await page.goto('/');
  const chart = page.getByTestId('deals-won-chart');
  await chart.scrollIntoViewIfNeeded();
  const box = (await chart.boundingBox())!;
  await page.mouse.move(box.x + (box.width * 11.5) / 12, box.y + box.height / 2);
  await page.mouse.move(box.x + (box.width * 11.5) / 12 + 2, box.y + box.height / 2 + 2);
  await expect(chart.getByRole('status')).toContainText(/\d+ deals? won/);
  const bars = chart.locator('.recharts-bar-rectangle path');
  expect(await bars.count()).toBeGreaterThanOrEqual(9);
});

test('[DASH-9] clicking a funnel segment opens the board', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /^Proposal: US\$/ }).click();
  await expect(page).toHaveURL(/\/pipeline$/);
});

test('[DASH-11] follow-ups: overdue first, then coming up', async ({ page }) => {
  await page.goto('/');
  const data = await api<Dashboard>(page, '/dashboard');
  const items = page.getByRole('list', { name: 'Follow-ups' }).getByTestId('follow-up');
  await expect(items).toHaveCount(data.follow_ups.items.length);
  await expect(items.first()).toContainText(data.follow_ups.items[0]!.description);
  expect(data.follow_ups.items.slice(0, 2).every((i) => i.follow_up_status === 'overdue')).toBe(true);
  await expect(items.first().getByRole('checkbox')).toHaveCSS('border-color', 'rgb(239, 71, 111)');
  await expect(items.first().getByRole('link')).toBeVisible();
});

test('[DASH-13] recent activity: the 15 newest, with initials and organization', async ({ page }) => {
  await page.goto('/');
  const data = await api<Dashboard>(page, '/dashboard');
  const items = page.getByRole('list', { name: 'Recent activity' }).getByTestId('recent-activity');
  await expect(items).toHaveCount(15);
  await expect(items.first()).toContainText(data.recent_activity[0]!.description);
  await expect(items.first().locator('span').first()).toHaveText(/^[A-Z]{1,2}$/);
});

test('[DASH-1] a deal moved to Won raises the won figures', async ({ page }) => {
  await page.goto('/');
  const before = await api<Dashboard>(page, '/dashboard');
  await page.goto('/deals');
  await page.getByRole('link', { name: 'Plant network upgrade' }).click();
  await page.getByRole('group', { name: 'Stage' }).getByRole('button', { name: 'Won' }).click();
  await expect(page.getByText('Moved to Won', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByTestId('figure-won')).toContainText(money(before.won_this_month.value + 42000));
  await expect(page.getByTestId('figure-open-pipeline')).toContainText(money(before.open_pipeline.value - 42000));
  await expect(page.getByRole('list', { name: 'Recent activity' }).getByTestId('recent-activity').first()).toContainText(
    'Moved from Qualified to Won',
  );
});
