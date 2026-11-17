// Accessibility: contrast and labels by axe, keyboard use, focus rings (LOOK-8).
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { api, expect, freshData, test } from './fixtures';

freshData();

async function pages(page: Page) {
  const [deal] = await api<Array<{ id: number }>>(page, '/deals');
  const [contact] = await api<Array<{ id: number }>>(page, '/contacts');
  const [org] = await api<Array<{ id: number }>>(page, '/organizations');
  return ['/', '/pipeline', '/deals', '/organizations', '/contacts', `/deals/${deal!.id}`, `/contacts/${contact!.id}`, `/organizations/${org!.id}`];
}

test('[LOOK-8] axe finds no contrast or labelling problems on any page', async ({ page }) => {
  for (const path of await pages(page)) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const problems = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 4).join(' | ')}`);
    expect(problems, `axe on ${path}`).toEqual([]);
  }
});

test('[LOOK-8] forms and dialogs pass axe too', async ({ page }) => {
  await page.goto('/deals');
  await page.getByRole('button', { name: 'Add deal' }).last().click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a name')).toBeVisible();
  let results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Actions for / }).first().click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('[LOOK-8] every section can be reached with Tab and Enter', async ({ page }) => {
  await page.goto('/');
  for (const tab of ['Pipeline', 'Deals', 'Organizations', 'Contacts']) {
    const link = page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: tab });
    for (let i = 0; i < 12 && !(await link.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: tab })).toBeVisible();
    await page.goto('/');
  }
});

test('[LOOK-8] a table row and its menu work from the keyboard', async ({ page }) => {
  await page.goto('/organizations');
  await page.getByRole('link', { name: 'Harbor Finance' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Harbor Finance' })).toBeVisible();
  await page.goBack();
  await page.getByRole('button', { name: 'Actions for Harbor Finance' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Edit organization' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('[LOOK-8] focus rings show, in Cerulean', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement!);
    return { style: s.outlineStyle, color: s.outlineColor, width: s.outlineWidth };
  });
  expect(ring).toEqual({ style: 'solid', color: 'rgb(17, 138, 178)', width: '2px' });
  await page.goto('/pipeline');
  const card = page.getByTestId('deal-card').first();
  await card.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(card).toHaveCSS('outline-color', 'rgb(17, 138, 178)');
});
