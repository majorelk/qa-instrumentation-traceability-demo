import { test, expect } from '@playwright/test';

// Force trace collection for this intentional failure demo
test.use({ trace: 'on' });

test('failure-demo: intentional test failure for artifact collection', async ({ page }) => {
  // Navigate to the web app
  await page.goto('/');
  
  // Verify basic page load
  await expect(page.locator('body')).toBeVisible();
  
  // Intentional failure to demonstrate artifact collection
  await expect(page.locator('h1')).toContainText('This text does not exist');
});