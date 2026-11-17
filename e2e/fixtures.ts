// A page fixture that fails any test on a console error (APP-13), and a reseed helper.
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const API = `http://127.0.0.1:${process.env.E2E_API_PORT ?? '8100'}/api`;

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await use(page);
    expect(errors, 'errors in the browser console').toEqual([]);
  },
});

export { expect };

/** Load the sample data again, the same way `npm run seed` does (APP-6). */
export function reseed() {
  const result = spawnSync('node', [join(ROOT, 'scripts', 'seed.mjs')], {
    cwd: ROOT,
    env: process.env,
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`Seeding failed: ${result.stderr}`);
}

/** Every spec starts from freshly seeded sample data. */
export function freshData() {
  test.beforeAll(() => reseed());
}

export async function api<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(`${API}${path}`);
  expect(response.ok()).toBe(true);
  return (await response.json()) as T;
}

/** Money as the app shows it. */
export const money = (n: number) => `US$${n.toLocaleString('en-US')}`;

/** Drag with the mouse in small steps, so dnd-kit sees a real drag. */
export async function drag(page: Page, from: Locator, to: Locator, { offsetY = 0 } = {}) {
  const a = (await from.boundingBox())!;
  const b = (await to.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2 + 10, { steps: 5 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + offsetY, { steps: 20 });
  await page.waitForTimeout(150);
  await page.mouse.up();
}

/** Pick an option in a searchable picker (FORM-2). */
export async function pick(page: Page, label: string, search: string, option: string | RegExp) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByPlaceholder('Type to search').fill(search);
  await page.getByRole('option', { name: option }).first().click();
}

/** Choose in a Radix select. */
export async function choose(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
