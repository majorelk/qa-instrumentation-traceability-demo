import { defineConfig, devices } from '@playwright/test';

const useDevServer = process.env.USE_DEV_SERVER === '1';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: useDevServer 
    ? {
        command: 'cd ../../apps/web && pnpm dev --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 90_000,
      }
    : {
        command: 'cd ../../apps/web && pnpm preview --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 90_000,
      },
});