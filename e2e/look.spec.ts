// The look: fonts, shapes, colors, surfaces and words (LAY-5, LOOK-1 to LOOK-3, LOOK-5, LOOK-6, DASH-14).
import type { Page } from '@playwright/test';
import { expect, freshData, test } from './fixtures';

freshData();

const css = (page: Page, selector: string, prop: string) =>
  page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test('[LOOK-1] Instrument Serif for titles, Instrument Sans for text, JetBrains Mono for numbers', async ({ page }) => {
  await page.goto('/');
  expect(await css(page, 'main h1', 'font-family')).toContain('Instrument Serif');
  expect(await css(page, 'main h1', 'font-size')).toBe('44px');
  expect(await css(page, 'body', 'font-family')).toContain('Instrument Sans');
  expect(await css(page, 'body', 'font-size')).toBe('14px');
  expect(await css(page, 'section h2', 'font-size')).toBe('16px');
  expect(await css(page, 'section h2', 'font-weight')).toBe('600');
  const figure = page.getByTestId('figure-open-pipeline').locator('p').nth(1);
  expect(await figure.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('JetBrains Mono');
  expect(await figure.evaluate((el) => getComputedStyle(el).fontSize)).toBe('34px');
  await page.goto('/deals');
  const value = page.locator('main tbody tr td:nth-child(5)').first();
  expect(await value.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('JetBrains Mono');
});

test('[LOOK-2] 20px panels, 16px cards, pill buttons, tabs and chips', async ({ page }) => {
  await page.goto('/');
  expect(await css(page, 'main section[aria-labelledby]', 'border-radius')).toBe('20px');
  await expect(page.getByRole('button', { name: 'Log activity' })).toHaveCSS('border-radius', '999px');
  await page.goto('/pipeline');
  await expect(page.getByTestId('deal-card').first()).toHaveCSS('border-radius', '16px');
  await expect(page.getByRole('button', { name: 'Open only' })).toHaveCSS('border-radius', '999px');
  await expect(page.getByRole('heading', { name: 'New', exact: true })).toHaveCSS('border-radius', '999px');
});

test('[LOOK-3] brand colors: Midnight text, Sea Green primary, Cerulean links, Raspberry for late', async ({ page }) => {
  await page.goto('/');
  expect(await css(page, 'body', 'color')).toBe('rgb(7, 59, 76)');
  const primary = page.locator('header').first().getByRole('button', { name: 'Add deal' });
  await expect(primary).toHaveCSS('background-color', 'rgb(6, 214, 160)');
  await expect(primary).toHaveCSS('color', 'rgb(7, 59, 76)');
  // Links in Cerulean, darkened for small text as LOOK-3 allows, so they pass AA (LOOK-8).
  await expect(page.getByRole('list', { name: 'Follow-ups' }).getByRole('link').first()).toHaveCSS('color', 'rgb(11, 110, 143)');
  await expect(page.getByTestId('figure-late').locator('p').nth(1)).toHaveCSS('color', 'rgb(239, 71, 111)');
  await expect(page.locator('main h1 em')).toHaveCSS('color', 'rgb(2, 112, 85)'); // Sea Green darkened for text
});

test('[LOOK-5] [LAY-5] page #F0F4F5, white panels with no outline or shadow, 24px gaps', async ({ page }) => {
  await page.goto('/');
  expect(await css(page, 'body', 'background-color')).toBe('rgb(240, 244, 245)');
  const panels = page.locator('main section[aria-labelledby]');
  for (const panel of (await panels.all()).slice(0, 5)) {
    const style = await panel.evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.backgroundColor, s.borderTopWidth, s.borderLeftWidth, s.boxShadow, s.outlineStyle];
    });
    expect(style).toEqual(['rgb(255, 255, 255)', '0px', '0px', 'none', 'none']);
  }
  const strip = page.getByRole('region', { name: 'Key figures' });
  expect(await strip.evaluate((el) => getComputedStyle(el).borderWidth)).toBe('0px');
  const [a, b] = await page.locator('main section[aria-labelledby]').evaluateAll((els) =>
    els.slice(0, 2).map((el) => el.getBoundingClientRect()),
  );
  expect(Math.round(b!.left - a!.right)).toBe(24);
  // No line across the top of the page.
  expect(await css(page, 'header', 'border-bottom-width')).toBe('0px');
  expect(await css(page, 'header', 'box-shadow')).toBe('none');
});

test('[LOOK-6] [DASH-14] money always has its currency; plain words, no exclamation marks', async ({ page }) => {
  for (const path of ['/', '/pipeline', '/deals', '/organizations', '/contacts']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const text = await page.locator('body').innerText();
    expect(text, `${path} has a bare dollar sign`).not.toMatch(/(?<!US)\$\d/);
    expect(text, `${path} has an exclamation mark`).not.toContain('!');
    if (path !== '/contacts') expect(text).toMatch(/US\$[\d,]+/);
  }
  await page.goto('/deals');
  expect(await page.locator('main tbody tr td:nth-child(8) .mono').first().innerText()).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/);
});

test('[DASH-14] chart tooltips show money with its currency', async ({ page }) => {
  await page.goto('/');
  const chart = page.getByTestId('revenue-chart');
  const box = (await chart.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(chart.getByRole('status')).toContainText(/US\$[\d,]+/);
});
