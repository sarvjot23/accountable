// Organizations: table, side-sheet form, record page and delete (TBL-1, TBL-3, TBL-8, REC-1, REC-2, FORM-5, DEL-1).
import { expect, freshData, test } from './fixtures';

freshData();

const rows = (page: import('@playwright/test').Page) => page.locator('main tbody tr');

test('[TBL-8] the table has the organization columns', async ({ page }) => {
  await page.goto('/organizations');
  await expect(page.locator('main thead th')).toHaveText([
    'Name',
    'Industry',
    'Website',
    'Contacts',
    'Open deals',
    'Open value',
    'Actions',
  ]);
  await expect(rows(page)).toHaveCount(6);
  const meridian = rows(page).filter({ hasText: 'Meridian Health' });
  await expect(meridian).toContainText('Healthcare');
  await expect(meridian).toContainText('meridianhealth.example');
  await expect(meridian).toContainText('US$180,000');
});

test('[TBL-3] [FORM-5] add opens a side sheet; saving closes it, shows a toast and refreshes the table', async ({ page }) => {
  await page.goto('/organizations');
  await page.getByRole('button', { name: 'Add organization' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Add organization' });
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  expect(box!.x + box!.width).toBeGreaterThan(1400); // on the right
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(sheet.getByText('Enter a name')).toBeVisible();
  await sheet.getByLabel('Name').fill('Atlas Freight');
  await sheet.getByLabel('Website').fill('atlasfreight.com');
  await sheet.getByLabel('Industry').fill('Logistics');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Organization saved', { exact: true })).toBeVisible();
  await expect(rows(page)).toHaveCount(7);
  await expect(rows(page).filter({ hasText: 'Atlas Freight' })).toContainText('atlasfreight.com');
});

test('[TBL-1] search filters as you type', async ({ page }) => {
  await page.goto('/organizations');
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('fin');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page)).toContainText('Harbor Finance');
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('education');
  await expect(rows(page)).toHaveText([/Westbrook University/]);
});

test('edit from the row menu', async ({ page }) => {
  await page.goto('/organizations');
  await page.getByRole('button', { name: 'Actions for Atlas Freight' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  const sheet = page.getByRole('dialog', { name: 'Edit organization' });
  await expect(sheet.getByLabel('Name')).toHaveValue('Atlas Freight');
  await sheet.getByLabel('Name').fill('Atlas Freight Co');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(rows(page).filter({ hasText: 'Atlas Freight Co' })).toHaveCount(1);
});

test('[REC-1] [REC-2] the record page shows its details, contacts and deals, with Add buttons that preset it', async ({ page }) => {
  await page.goto('/organizations');
  await rows(page).filter({ hasText: 'Meridian Health' }).getByText('Healthcare').click();
  await expect(page).toHaveURL(/\/organizations\/\d+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Meridian Health' })).toBeVisible();
  const header = page.getByRole('region', { name: 'Organization details' });
  await expect(header.getByRole('button', { name: 'Edit' })).toBeVisible();
  await expect(header.getByRole('button', { name: 'Delete' })).toBeVisible();
  await expect(page.getByText(/Regional hospital group/)).toBeVisible();

  const contacts = page.getByRole('region', { name: 'Contacts' });
  await expect(contacts.getByRole('link')).toHaveText(['Grace Liu', 'Owen Hart', 'Priya Nair']);
  const deals = page.getByRole('region', { name: 'Deals' });
  await expect(deals.getByRole('link', { name: 'Cloud migration' })).toBeVisible();
  await expect(deals).toContainText('US$180,000');

  await contacts.getByRole('button', { name: 'Add contact' }).click();
  await expect(page.getByRole('combobox', { name: 'Organization' })).toHaveText(/Meridian Health/);
  await page.keyboard.press('Escape');
  await deals.getByRole('button', { name: 'Add deal' }).click();
  await expect(page.getByRole('combobox', { name: 'Organization' })).toHaveText(/Meridian Health/);
});

test('[DEL-1] delete names the counts, and removes the linked records', async ({ page }) => {
  await page.goto('/organizations');
  await rows(page).filter({ hasText: 'Bluepeak Retail' }).getByRole('link', { name: 'Bluepeak Retail' }).click();
  await page.getByRole('region', { name: 'Organization details' }).getByRole('button', { name: 'Delete' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Delete Bluepeak Retail?');
  await expect(dialog).toContainText(/This also deletes 2 contacts, 3 deals and \d+ activities\./);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Delete' })).toHaveCSS('background-color', 'rgb(201, 38, 78)');
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/organizations$/);
  await expect(page.getByText('Organization deleted', { exact: true })).toBeVisible();
  await expect(rows(page).filter({ hasText: 'Bluepeak Retail' })).toHaveCount(0);
  await page.goto('/contacts');
  await expect(page.locator('main tbody tr').filter({ hasText: 'Lena Cho' })).toHaveCount(0);
  await page.goto('/deals');
  await expect(page.locator('main tbody tr').filter({ hasText: 'Data platform' })).toHaveCount(0);
});
