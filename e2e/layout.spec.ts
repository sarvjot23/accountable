// The top bar, tabs and search, and page headers (LAY-2, LAY-3, LAY-4).
import { expect, freshData, test } from './fixtures';

freshData();

test('[LAY-2] the top bar has the wordmark, tabs, search and Add deal', async ({ page }) => {
  await page.goto('/');
  const bar = page.locator('header').first();
  const box = await bar.boundingBox();
  expect(box!.height).toBe(68);
  await expect(bar).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(bar.getByRole('link', { name: /Accountable/ })).toBeVisible();
  const tabs = page.getByRole('navigation', { name: 'Sections' }).getByRole('link');
  await expect(tabs).toHaveText(['Dashboard', 'Pipeline', 'Deals', 'Organizations', 'Contacts']);
  await expect(bar.getByRole('combobox', { name: 'Search deals, people and companies' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Add deal' })).toBeVisible();
});

test('[LAY-2] the current tab is a Midnight pill with white text', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Deals', exact: true }).click();
  const current = page.getByRole('link', { name: 'Deals', exact: true });
  await expect(current).toHaveAttribute('aria-current', 'page');
  await expect(current).toHaveCSS('background-color', 'rgb(7, 59, 76)');
  await expect(current).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(current).toHaveCSS('border-radius', '999px');
  await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).not.toHaveAttribute('aria-current', 'page');
});

test('[LAY-4] every page opens with a header: title in Instrument Serif at 44px, a summary and actions', async ({ page }) => {
  for (const [path, title] of [
    ['/pipeline', 'Pipeline'],
    ['/deals', 'Deals'],
    ['/organizations', 'Organizations'],
    ['/contacts', 'Contacts'],
  ]) {
    await page.goto(path);
    const h1 = page.getByRole('heading', { level: 1, name: title });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveCSS('font-size', '44px');
    expect(await h1.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Instrument Serif');
    await expect(page.locator('main header p').first()).toBeVisible();
    await expect(page.locator('main').getByRole('button', { name: /Add/ }).first()).toBeVisible();
  }
  await page.goto('/deals');
  const main = await page.locator('main').boundingBox();
  const h1 = await page.getByRole('heading', { level: 1 }).boundingBox();
  expect(h1!.x - main!.x).toBe(40); // 40px side margins
});

test('[LAY-3] global search opens a deal, a contact and an organization', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Search deals, people and companies' });

  await search.fill('cloud');
  await page.getByRole('option', { name: /Cloud migration/ }).click();
  await expect(page).toHaveURL(/\/deals\/\d+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Cloud migration' })).toBeVisible();

  await search.fill('grace');
  await page.getByRole('option', { name: /Grace Liu/ }).click();
  await expect(page).toHaveURL(/\/contacts\/\d+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Grace Liu' })).toBeVisible();

  await search.fill('harbor');
  await search.press('ArrowDown');
  await expect(page.getByRole('option', { name: /Harbor Finance/ })).toBeVisible();
  await page.getByRole('option', { name: /Harbor Finance/ }).click();
  await expect(page).toHaveURL(/\/organizations\/\d+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Harbor Finance' })).toBeVisible();
});

test('[LAY-3] search says when nothing is found', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Search deals, people and companies' }).fill('zzzz');
  await expect(page.getByText('Nothing found for “zzzz”')).toBeVisible();
});
