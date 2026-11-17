// Activities and follow-ups (REC-6 to REC-10, DASH-12).
import { format, addDays } from 'date-fns';
import { choose, expect, freshData, test } from './fixtures';

freshData();

const timeline = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Timeline' });
const DESCRIPTION = 'Called Raj about the contract terms';

test('[REC-10] [REC-6] [REC-7] log a call with a follow-up on a deal, with its contact', async ({ page }) => {
  await page.goto('/deals');
  await page.getByRole('link', { name: 'Managed IT contract' }).click();
  await timeline(page).getByRole('button', { name: 'Log activity' }).click();
  const sheet = page.getByRole('dialog', { name: 'Log activity' });
  await expect(sheet.getByRole('combobox', { name: 'Deal' })).toHaveText(/Managed IT contract/);
  await expect(sheet.getByRole('combobox', { name: 'Contact' })).toHaveText(/Raj Mehta/);
  await choose(page, 'Type', 'Call');
  await sheet.getByLabel('Description').fill(DESCRIPTION);
  await sheet.getByLabel('Follow-up date').fill(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Activity logged', { exact: true })).toBeVisible();

  // Newest first, with its icon and follow-up.
  const first = timeline(page).getByTestId('timeline-entry').first();
  await expect(first).toContainText(DESCRIPTION);
  await expect(first.getByText('Call', { exact: true })).toBeAttached();
  await expect(first.getByRole('checkbox', { name: `Done: ${DESCRIPTION}` })).toBeVisible();

  // In the contact's timeline too.
  await timeline(page).getByTestId('timeline-entry').first().getByRole('link', { name: 'Raj Mehta' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Raj Mehta' })).toBeVisible();
  await expect(timeline(page).getByTestId('timeline-entry').first()).toContainText(DESCRIPTION);
  await expect(timeline(page).getByTestId('timeline-entry').first().getByRole('link', { name: 'Managed IT contract' })).toBeVisible();

  // And on the dashboard as a follow-up.
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Follow-ups' })).toContainText(DESCRIPTION);
});

test('[REC-9] Done from the timeline takes it off the dashboard', async ({ page }) => {
  await page.goto('/contacts');
  await page.getByRole('link', { name: 'Raj Mehta' }).click();
  const check = timeline(page).getByRole('checkbox', { name: `Done: ${DESCRIPTION}` });
  await check.click();
  await expect(check).toHaveAttribute('aria-checked', 'true');
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Follow-ups' })).not.toContainText(DESCRIPTION);
});

test('[DASH-12] Done on the dashboard takes the follow-up off the list', async ({ page }) => {
  await page.goto('/');
  const list = page.getByRole('list', { name: 'Follow-ups' });
  const item = list.getByTestId('follow-up').filter({ hasText: 'Booked a demo of the support assistant' });
  await expect(item).toHaveCount(1);
  const count = await list.getByTestId('follow-up').count();
  await item.getByRole('checkbox').click();
  await expect(item).toHaveCount(0);
  await expect(list.getByTestId('follow-up')).toHaveCount(count - 1);
});

test('[REC-8] edit and delete a stage-change entry', async ({ page }) => {
  await page.goto('/deals');
  await page.getByRole('link', { name: 'Route optimisation AI' }).click();
  await timeline(page).getByRole('button', { name: 'Actions for Moved from Qualified to Proposal' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  const sheet = page.getByRole('dialog', { name: 'Edit stage change' });
  await expect(sheet.getByRole('combobox', { name: 'Type' })).toHaveCount(0);
  await sheet.getByLabel('Description').fill('Moved to Proposal after the pilot review');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(timeline(page)).toContainText('Moved to Proposal after the pilot review');

  await timeline(page).getByRole('button', { name: 'Actions for Moved to Proposal after the pilot review' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('The deal stays in its current stage.');
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(timeline(page)).not.toContainText('Moved to Proposal after the pilot review');
  await expect(page.getByRole('group', { name: 'Stage' }).getByRole('button', { name: 'Proposal' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('[REC-8] edit and delete an ordinary activity', async ({ page }) => {
  await page.goto('/contacts');
  await page.getByRole('link', { name: 'Lena Cho' }).click();
  await timeline(page).getByRole('button', { name: 'Actions for Sent the case study on store analytics' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByLabel('Description').fill('Sent two case studies on store analytics');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(timeline(page)).toContainText('Sent two case studies on store analytics');
  await timeline(page).getByRole('button', { name: 'Actions for Sent two case studies on store analytics' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(timeline(page)).not.toContainText('Sent two case studies');
});
