import { defineConfig, devices } from '@playwright/test';

const useDev = !!process.env.USE_DEV_SERVER;

export default defineConfig({
  testDir: 'tests',
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
  webServer: {
    // Start the web app from the correct directory.
    command: useDev
      ? 'bash -lc "cd ../../apps/web && pnpm dev -- --port 5173 --strictPort"'
      : 'bash -lc "cd ../../apps/web && pnpm preview --port 5173 --strictPort"',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});

