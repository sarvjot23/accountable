// End-to-end tests in the installed Chrome. They start the app themselves, on their own
// ports and with their own database, so `npm test` needs nothing else running (APP-7).
import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const API_PORT = '8100';
const WEB_PORT = '5180';
process.env.ACCOUNTABLE_DB ??= join(tmpdir(), 'accountable-e2e', 'accountable.db');
process.env.E2E_API_PORT = API_PORT;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      // Reseed, then serve the API.
      command: `node scripts/seed.mjs && uv run uvicorn accountable.main:app --app-dir backend --port ${API_PORT}`,
      url: `http://127.0.0.1:${API_PORT}/api/meta/stages`,
      env: { ACCOUNTABLE_DB: process.env.ACCOUNTABLE_DB },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // The built app, as a user would get it.
      command: 'npm run build --workspace frontend && npm run preview --workspace frontend',
      url: `http://localhost:${WEB_PORT}`,
      env: { ACCOUNTABLE_API_PORT: API_PORT, ACCOUNTABLE_WEB_PORT: WEB_PORT },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
