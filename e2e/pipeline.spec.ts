// The pipeline board (PIPE-1 to PIPE-6, PIPE-8 to PIPE-11, PIPE-13, PIPE-14).
import type { Page } from '@playwright/test';
import { api, drag, expect, freshData, money, test } from './fixtures';

freshData();

const column = (page: Page, label: string) => page.getByRole('region', { name: label, exact: true });
const card = (page: Page, name: string) => page.getByTestId('deal-card').filter({ hasText: name });
const cardNames = (page: Page, label: string) => column(page, label).getByTestId('deal-card').locator('p:nth-child(2)').allTextContents();

interface Deal {
  id: number;
  name: string;
  stage: string;
  position: number;
}
const dealByName = async (page: Page, name: string) => (await api<Deal[]>(page, '/deals')).find((d) => d.name === name)!;

test('[PIPE-1] the header sums up the open pipeline', async ({ page }) => {
  await page.goto('/pipeline');
  await expect(page.getByTestId('pipeline-summary')).toHaveText('US$695,000 open across 8 deals · US$371,450 expected');
});

test('[PIPE-3] six equal columns with stage pills, counts, totals and expected revenue', async ({ page }) => {
  await page.goto('/pipeline');
  const labels = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const widths: number[] = [];
  for (const label of labels) {
    const col = column(page, label);
    await expect(col).toBeVisible();
    widths.push(Math.round((await col.boundingBox())!.width));
  }
  expect(new Set(widths).size).toBe(1);
  const proposal = column(page, 'Proposal');
  await expect(proposal.getByRole('heading', { name: 'Proposal' })).toHaveCSS('background-color', 'rgb(247, 140, 107)');
  await expect(proposal.getByLabel('2 deals')).toHaveText('2');
  await expect(page.getByTestId('column-value-proposal')).toHaveText('US$276,000');
  await expect(page.getByTestId('column-sub-proposal')).toHaveText('US$138,000 expected');
});

test('[PIPE-2] Open only hides Won and Lost; All stages shows them', async ({ page }) => {
  await page.goto('/pipeline');
  await page.getByRole('button', { name: 'Open only' }).click();
  await expect(column(page, 'Won')).toHaveCount(0);
  await expect(column(page, 'Lost')).toHaveCount(0);
  await expect(column(page, 'Negotiation')).toBeVisible();
  await page.getByRole('button', { name: 'All stages' }).click();
  await expect(column(page, 'Won')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add deal' }).first()).toBeVisible();
});

test('[PIPE-4] Won and Lost show the last 12 months, most recent first, the rest behind "N more"', async ({ page }) => {
  await page.goto('/pipeline');
  await expect(page.getByTestId('column-sub-won')).toHaveText('Closed, last 12 months');
  await expect(page.getByTestId('column-value-won')).toHaveText('US$567,000');
  const won = column(page, 'Won');
  await expect(won.getByTestId('deal-card')).toHaveCount(4);
  await expect(won.getByTestId('deal-card').first()).toContainText('Endpoint security rollout');
  await won.getByRole('button', { name: '6 more won deals' }).click();
  await expect(won.getByTestId('deal-card')).toHaveCount(10);
  await expect(page.getByTestId('column-sub-lost')).toHaveText('Closed, last 12 months');
});

test('[PIPE-5] a card shows the organization, name, value, probability, contact and close date', async ({ page }) => {
  await page.goto('/pipeline');
  const c = card(page, 'Store analytics pilot');
  await expect(c).toContainText('Bluepeak Retail');
  await expect(c).toContainText('US$24,000');
  await expect(c).toContainText('10%');
  await expect(c).toContainText('Lena Cho');
  await expect(c).toHaveCSS('border-radius', '16px');
  await expect(c).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('[PIPE-6] a late card has a Raspberry outline and a "Late · date" pill', async ({ page }) => {
  await page.goto('/pipeline');
  const c = card(page, 'Cloud migration');
  await expect(c.getByText(/^Late · \d{1,2} \w{3}$/)).toBeVisible();
  expect(await c.evaluate((el) => getComputedStyle(el).boxShadow)).toContain('rgb(249, 183, 199)');
});

test('[PIPE-8] [PIPE-11] dragging to another column changes the stage, and totals change at once', async ({ page }) => {
  await page.goto('/pipeline');
  // Hold the save, to see the totals change before it finishes.
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  await page.route('**/api/deals/*/move', async (route) => {
    await held;
    await route.continue();
  });
  await drag(page, card(page, 'Store analytics pilot'), column(page, 'Qualified').getByTestId('deal-card').last());
  try {
    await expect(page.getByTestId('column-value-qualified')).toHaveText('US$131,000');
    await expect(page.getByTestId('column-sub-qualified')).toHaveText('US$32,750 expected');
    await expect(page.getByTestId('column-value-new')).toHaveText('US$18,000');
    await expect(page.getByTestId('pipeline-summary')).toHaveText('US$695,000 open across 8 deals · US$375,050 expected');
  } finally {
    release();
  }
  await expect.poll(async () => (await dealByName(page, 'Store analytics pilot')).stage).toBe('qualified');
  const moved = await api<Deal & { probability: number }>(page, `/deals/${(await dealByName(page, 'Store analytics pilot')).id}`);
  expect(moved.probability).toBe(25);
  await page.unroute('**/api/deals/*/move');
});

test('[PIPE-9] a card dropped higher in its own column stays there after a refresh', async ({ page }) => {
  await page.goto('/pipeline');
  const before = await cardNames(page, 'Qualified');
  expect(before.length).toBe(3);
  const last = before[2]!;
  await drag(page, card(page, last), card(page, before[0]!), { offsetY: -30 });
  await expect.poll(() => cardNames(page, 'Qualified')).toEqual([last, before[0], before[1]]);
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect.poll(() => cardNames(page, 'Qualified')).toEqual([last, before[0], before[1]]);
});

test('[PIPE-9] a card dropped lower in its own column stays there too', async ({ page }) => {
  await page.goto('/pipeline');
  const before = await cardNames(page, 'Qualified');
  await drag(page, card(page, before[0]!), card(page, before[1]!), { offsetY: 30 });
  await expect.poll(() => cardNames(page, 'Qualified')).toEqual([before[1], before[0], before[2]]);
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect.poll(() => cardNames(page, 'Qualified')).toEqual([before[1], before[0], before[2]]);
});

test('[PIPE-10] cards move with the keyboard', async ({ page }) => {
  await page.goto('/pipeline');
  const c = card(page, 'Route optimisation AI');
  await c.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await expect(column(page, 'Negotiation').getByTestId('deal-card').filter({ hasText: 'Route optimisation AI' })).toHaveCount(1);
  await expect.poll(async () => (await dealByName(page, 'Route optimisation AI')).stage).toBe('negotiation');
});

test('[PIPE-13] "+" in a column adds a deal at that stage', async ({ page }) => {
  await page.goto('/pipeline');
  const before = Number((await page.getByTestId('column-value-proposal').innerText()).replace(/[^\d]/g, ''));
  await page.getByRole('button', { name: 'Add deal in Proposal' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add deal' });
  await expect(sheet.getByRole('combobox', { name: 'Stage' })).toHaveText(/Proposal/);
  await expect(sheet.getByLabel('Probability (%)')).toHaveValue('50');
  await sheet.getByLabel('Name').fill('Warehouse robots study');
  await page.getByRole('combobox', { name: 'Organization' }).click();
  await page.getByPlaceholder('Type to search').fill('northwind');
  await page.getByRole('option', { name: /Northwind Logistics/ }).click();
  await sheet.getByLabel('Value').fill('60000');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(column(page, 'Proposal').getByTestId('deal-card').filter({ hasText: 'Warehouse robots study' })).toBeVisible();
  await expect(page.getByTestId('column-value-proposal')).toHaveText(money(before + 60000));
});

test('[PIPE-14] clicking a card opens the deal', async ({ page }) => {
  await page.goto('/pipeline');
  await card(page, 'Fraud model review').click();
  await expect(page).toHaveURL(/\/deals\/\d+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Fraud model review' })).toBeVisible();
});
