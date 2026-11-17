// Deals: columns, sort, late chip, filters, picker, record page and stage selector
// (TBL-2, TBL-11, TBL-12, TBL-13, FORM-2, REC-4, REC-5).
import { expect, freshData, pick, test } from './fixtures';

freshData();

const rows = (page: import('@playwright/test').Page) => page.locator('main tbody tr');
const dollars = (text: string) => Number(text.replace(/[^\d]/g, ''));

test('[TBL-11] the table has the deal columns', async ({ page }) => {
  await page.goto('/deals');
  await expect(page.locator('main thead th')).toHaveText([
    'Name',
    'Organization',
    'Contact',
    'Stage',
    'Value',
    'Probability',
    'Expected revenue',
    'Close date',
    'Actions',
  ]);
  await expect(rows(page)).toHaveCount(20);
  const route = rows(page).filter({ hasText: 'Route optimisation AI' });
  await expect(route).toContainText('Northwind Logistics');
  await expect(route).toContainText('Sam Patel');
  await expect(route).toContainText('Proposal');
  await expect(route).toContainText('US$96,000');
  await expect(route).toContainText('50%');
  await expect(route).toContainText('US$48,000');
});

test('[TBL-2] sort by value, and again to reverse', async ({ page }) => {
  await page.goto('/deals');
  const values = async () => (await rows(page).locator('td:nth-child(5)').allTextContents()).map(dollars);
  await page.getByRole('button', { name: 'Value' }).click();
  const first = await values();
  await page.getByRole('button', { name: /Value/ }).click();
  const second = await values();
  expect(second).toEqual([...first].reverse());
  const ascending = [...first].sort((a, b) => a - b);
  expect([first, second]).toContainEqual(ascending);
  await expect(page.getByRole('columnheader', { name: /Value/ })).toHaveAttribute('aria-sort', /ascending|descending/);
});

test('[TBL-13] late deals show a Raspberry Late chip and date', async ({ page }) => {
  await page.goto('/deals');
  const late = rows(page).filter({ has: page.getByText('Late', { exact: true }) });
  await expect(late).toHaveCount(2);
  await expect(late.filter({ hasText: 'Cloud migration' })).toHaveCount(1);
  const chip = late.first().getByText('Late', { exact: true });
  await expect(chip).toHaveCSS('color', 'rgb(176, 25, 63)');
  const date = late.first().locator('td:nth-child(8) .mono');
  await expect(date).toHaveCSS('color', 'rgb(176, 25, 63)');
});

test('[TBL-12] filter by stage, and Late only', async ({ page }) => {
  await page.goto('/deals');
  const stages = page.getByRole('group', { name: 'Filter by stage' });
  await stages.getByRole('button', { name: 'Won' }).click();
  await expect(rows(page)).toHaveCount(10);
  await stages.getByRole('button', { name: 'Open' }).click();
  await expect(rows(page)).toHaveCount(8);
  await page.getByRole('button', { name: 'Late only' }).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(page).toHaveURL(/stage=open&late=1/);
  await stages.getByRole('button', { name: 'All' }).click();
  await page.getByRole('button', { name: 'Late only' }).click();
  await expect(rows(page)).toHaveCount(20);
});

test('[FORM-2] add a deal with a searchable organization picker', async ({ page }) => {
  await page.goto('/deals');
  await page.getByRole('button', { name: 'Add deal' }).last().click();
  const sheet = page.getByRole('dialog', { name: 'Add deal' });
  await sheet.getByLabel('Name').fill('Library chatbot');
  await pick(page, 'Organization', 'west', /Westbrook University/);
  await pick(page, 'Main contact', 'leo', /Leo Fischer/);
  await sheet.getByLabel('Value').fill('35000');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Deal saved', { exact: true })).toBeVisible();
  const row = rows(page).filter({ hasText: 'Library chatbot' });
  await expect(row).toContainText('Westbrook University');
  await expect(row).toContainText('New');
  await expect(row).toContainText('US$35,000');
  await expect(row).toContainText('10%');
});

test('[REC-4] the deal page shows its figures, links and timeline', async ({ page }) => {
  await page.goto('/deals');
  await page.getByRole('link', { name: 'Managed IT contract' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Managed IT contract' })).toBeVisible();
  const details = page.getByRole('region', { name: 'Details', exact: true });
  await expect(details).toContainText('Negotiation');
  await expect(details).toContainText('US$120,000');
  await expect(details).toContainText('75%');
  await expect(details).toContainText('US$90,000');
  await expect(details.getByRole('link', { name: 'Harbor Finance' })).toBeVisible();
  await expect(details.getByRole('link', { name: 'Raj Mehta' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Timeline' }).getByText('Moved from Proposal to Negotiation')).toBeVisible();

  await page.goto('/deals');
  await page.getByRole('link', { name: 'Cloud migration' }).click();
  await expect(page.getByRole('region', { name: 'Details', exact: true }).getByText('Late', { exact: true })).toBeVisible();
});

test('[REC-5] the stage selector moves the deal by the stage rule', async ({ page }) => {
  await page.goto('/deals');
  await page.getByRole('link', { name: 'Managed IT contract' }).click();
  const selector = page.getByRole('group', { name: 'Stage' });
  await expect(selector.getByRole('button', { name: 'Negotiation' })).toHaveAttribute('aria-pressed', 'true');
  await selector.getByRole('button', { name: 'Won' }).click();
  await expect(page.getByText('Moved to Won', { exact: true })).toBeVisible();
  await expect(selector.getByRole('button', { name: 'Won' })).toHaveAttribute('aria-pressed', 'true');
  const details = page.getByRole('region', { name: 'Details', exact: true });
  await expect(details).toContainText('100%');
  await expect(details).toContainText('US$120,000');
  await expect(page.getByRole('region', { name: 'Timeline' }).getByTestId('timeline-entry').first()).toContainText(
    'Moved from Negotiation to Won',
  );
  await page.goto('/deals');
  await expect(rows(page).filter({ hasText: 'Managed IT contract' })).toContainText('Won');
});
