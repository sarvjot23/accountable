// Contacts: columns, status filter, row menu, row click, record page and delete (TBL-4, TBL-5, TBL-9, TBL-10, REC-3).
import { choose, expect, freshData, pick, test } from './fixtures';

freshData();

const rows = (page: import('@playwright/test').Page) => page.locator('main tbody tr');

test('[TBL-9] the table has the contact columns, with a colored status chip', async ({ page }) => {
  await page.goto('/contacts');
  await expect(page.locator('main thead th')).toHaveText(['Name', 'Organization', 'Job title', 'Email', 'Phone', 'Status', 'Actions']);
  await expect(rows(page)).toHaveCount(15);
  const grace = rows(page).filter({ hasText: 'Grace Liu' });
  await expect(grace).toContainText('Meridian Health');
  await expect(grace).toContainText('Chief Information Officer');
  await expect(grace.getByText('Customer')).toHaveCSS('border-radius', '999px');
});

test('add a lead', async ({ page }) => {
  await page.goto('/contacts');
  await page.getByRole('button', { name: 'Add contact' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Add contact' });
  await sheet.getByLabel('First name').fill('Nina');
  await sheet.getByLabel('Last name').fill('Shah');
  await pick(page, 'Organization', 'harb', /Harbor Finance/);
  await sheet.getByLabel('Email').fill('nina.shah@harborfinance.example');
  await expect(sheet.getByRole('combobox', { name: 'Status' })).toHaveText(/Lead/);
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Contact saved', { exact: true })).toBeVisible();
  const nina = rows(page).filter({ hasText: 'Nina Shah' });
  await expect(nina).toContainText('Harbor Finance');
  await expect(nina).toContainText('Lead');
});

test('[TBL-10] filter by status, with counts', async ({ page }) => {
  await page.goto('/contacts');
  const filters = page.getByRole('group', { name: 'Filter by status' });
  await expect(filters.getByRole('button')).toHaveText(['All16', 'Lead7', 'Qualified4', 'Customer5']);
  await filters.getByRole('button', { name: /Customer/ }).click();
  await expect(rows(page)).toHaveCount(5);
  for (const row of await rows(page).all()) await expect(row).toContainText('Customer');
  await filters.getByRole('button', { name: /Lead/ }).click();
  await expect(rows(page)).toHaveCount(7);
  await filters.getByRole('button', { name: /All/ }).click();
  await expect(rows(page)).toHaveCount(16);
});

test('[TBL-4] edit from the row menu: the lead becomes a customer', async ({ page }) => {
  await page.goto('/contacts');
  await page.getByRole('button', { name: 'Actions for Nina Shah' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await choose(page, 'Status', 'Customer');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(rows(page).filter({ hasText: 'Nina Shah' })).toContainText('Customer');
});

test('[TBL-5] clicking a row opens the contact', async ({ page }) => {
  await page.goto('/contacts');
  await rows(page).filter({ hasText: 'Nina Shah' }).getByText('nina.shah@harborfinance.example').click();
  await expect(page).toHaveURL(/\/contacts\/\d+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Nina Shah' })).toBeVisible();
});

test('[REC-3] the contact page has details, status, organization, deals and the timeline', async ({ page }) => {
  await page.goto('/contacts');
  await rows(page).filter({ hasText: 'Grace Liu' }).getByRole('link', { name: 'Grace Liu' }).click();
  const header = page.getByRole('region', { name: 'Contact details' });
  await expect(header.getByText('Customer')).toBeVisible();
  await expect(header.getByRole('link', { name: 'Meridian Health' })).toHaveAttribute('href', /\/organizations\/\d+/);
  const deals = page.getByRole('region', { name: 'Deals' });
  await expect(deals.getByRole('link')).toHaveText(['Cloud migration', 'Endpoint security rollout']);
  const timeline = page.getByRole('region', { name: 'Timeline' });
  await expect(timeline.getByRole('button', { name: 'Log activity' })).toBeVisible();
  await expect(timeline.getByText('Sent the revised SOW for the cloud migration')).toBeVisible();
});

test('[TBL-4] delete keeps their activities and deals', async ({ page }) => {
  await page.goto('/contacts');
  await page.getByRole('button', { name: 'Actions for Grace Liu' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(/Only the contact is deleted: their \d+ activities stay as history and 2 deals stay with no main contact\./);
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(rows(page).filter({ hasText: 'Grace Liu' })).toHaveCount(0);

  await page.goto('/deals');
  await page.getByRole('link', { name: 'Cloud migration' }).click();
  await expect(page.getByText('Main contact')).toBeVisible();
  const timeline = page.getByRole('region', { name: 'Timeline' });
  await expect(timeline.getByText('Sent the revised SOW for the cloud migration')).toBeVisible();
});
