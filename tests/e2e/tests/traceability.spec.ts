import { test, expect } from '@playwright/test';

test('end-to-end request traceability with telemetry correlation', async ({ page }) => {
  // Navigate to the web app
  await page.goto('/');
  
  // Verify the page loaded correctly
  await expect(page.locator('h1')).toContainText('QA Instrumentation Demo');
  
  // Click the "Trigger API Error" button
  const button = page.locator('button:has-text("Trigger API Error")');
  await expect(button).toBeVisible();
  
  // Click the button and wait for the network request to complete
  await button.click();
  
  // Wait a moment for the fetch to complete and telemetry to be sent
  await page.waitForTimeout(1000);
  
  // Read the request ID from the window object
  const requestId = await page.evaluate(() => (window as any).__lastReqId);
  expect(requestId).toBeDefined();
  expect(typeof requestId).toBe('string');
  expect(requestId).toMatch(/^[0-9a-f-]+$/i);
  
  // Fetch the last telemetry event from the API
  const response = await page.request.get('http://localhost:3000/debug/last-event');
  expect(response.status()).toBe(200);
  
  const lastEvent = await response.json();
  
  // Verify the telemetry event has the correct structure and request_id
  expect(lastEvent).toMatchObject({
    level: 'error',
    env: 'development',
    release: 'local',
    route: '/api/fail',
    status: 500,
    error_code: 'API_ERROR',
    request_id: requestId,
  });
  
  expect(lastEvent.ts).toBeGreaterThan(0);
  expect(lastEvent.error).toContain('500');
  
  console.log(`✓ Request correlation verified with ID: ${requestId}`);
  console.log(`✓ Telemetry event captured:`, lastEvent);
});