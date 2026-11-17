// Changes are kept through a refresh and a restart (APP-11), and the seed command resets them (APP-6).
import { spawn, type ChildProcess } from 'node:child_process';
import { expect, freshData, reseed, ROOT, test } from './fixtures';

freshData();

const PORT = 8101; // a second backend on the same database, stopped and started by the test

async function startBackend(): Promise<ChildProcess> {
  const child = spawn('uv', ['run', 'uvicorn', 'accountable.main:app', '--app-dir', 'backend', '--port', String(PORT)], {
    cwd: ROOT,
    env: process.env,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/api/meta/stages`)).ok) return child;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('The backend did not start');
}

async function stopBackend(child: ChildProcess) {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  else child.kill('SIGTERM');
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${PORT}/api/meta/stages`);
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}

const orgNames = async () =>
  ((await (await fetch(`http://127.0.0.1:${PORT}/api/organizations`)).json()) as Array<{ name: string }>).map((o) => o.name);

test('[APP-11] a change is still there after a refresh', async ({ page }) => {
  await page.goto('/organizations');
  await page.getByRole('button', { name: 'Add organization' }).first().click();
  await page.getByLabel('Name').fill('Kept Through Refresh');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('link', { name: 'Kept Through Refresh' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Kept Through Refresh' })).toBeVisible();
});

test('[APP-11] a change is still there after the backend is stopped and started again', async () => {
  test.setTimeout(90_000);
  let backend = await startBackend();
  try {
    expect(await orgNames()).toContain('Kept Through Refresh');
  } finally {
    await stopBackend(backend);
  }
  backend = await startBackend();
  try {
    expect(await orgNames()).toContain('Kept Through Refresh');
  } finally {
    await stopBackend(backend);
  }
});

test('[APP-6] the seed command brings back the sample data', async ({ page }) => {
  reseed();
  await page.goto('/organizations');
  await expect(page.locator('main tbody tr')).toHaveCount(6);
  await expect(page.getByRole('link', { name: 'Kept Through Refresh' })).toHaveCount(0);
  await page.goto('/deals');
  await expect(page.locator('main tbody tr')).toHaveCount(20);
});
