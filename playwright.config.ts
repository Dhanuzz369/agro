import { defineConfig, devices } from '@playwright/test';
// E2E_PORT lets the suite run when 4321 is taken by another local server.
const port = Number(process.env.E2E_PORT ?? 4321);
export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: `http://localhost:${port}` },
  webServer: { command: `npm run build && npx astro preview --port ${port}`, port, reuseExistingServer: true, timeout: 240_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
