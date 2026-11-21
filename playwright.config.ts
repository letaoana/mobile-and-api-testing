import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const isCI = Boolean(process.env.CI);

// Playwright's request context does not read the standard proxy variables on its
// own, so pass them through for runs behind a corporate proxy.
const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;

// Only Playwright's request context is used, so no browser is needed.
export default defineConfig({
  testDir: './tests/api/specs',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: 'reports/api/test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/api/html', open: 'never' }],
    ['junit', { outputFile: 'reports/api/junit/results.xml' }],
  ],
  use: {
    baseURL: process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com',
    // Restful Booker answers 418 unless the client explicitly accepts JSON.
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...(proxyServer && {
      proxy: { server: proxyServer, bypass: process.env.NO_PROXY || process.env.no_proxy },
    }),
  },
  projects: [{ name: 'restful-booker' }],
});
