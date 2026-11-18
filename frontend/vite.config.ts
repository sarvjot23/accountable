/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The backend's address. End-to-end tests run their own backend on another port.
const apiPort = process.env.ACCOUNTABLE_API_PORT ?? '8000';
const webPort = Number(process.env.ACCOUNTABLE_WEB_PORT ?? '5173');

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 },
  server: {
    port: webPort,
    strictPort: true,
    proxy: { '/api': `http://127.0.0.1:${apiPort}` },
  },
  preview: {
    port: webPort,
    strictPort: true,
    proxy: { '/api': `http://127.0.0.1:${apiPort}` },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // Multi-step page tests can pass 5 seconds when the whole suite runs with coverage.
    testTimeout: 20_000,
    restoreMocks: true,
    unstubGlobals: true,
    // Unit test coverage must stay at 80% or more.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/lib/api-types.ts', 'src/main.tsx'],
      reporter: ['text-summary'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
