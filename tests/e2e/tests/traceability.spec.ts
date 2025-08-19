import { test, expect } from '@playwright/test';

// Configure tests to run serially to avoid debug endpoint conflicts
test.describe.configure({ mode: 'serial' });

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
    error_code: 'HTTP_ERROR',
    request_id: requestId,
  });
  
  expect(lastEvent.ts).toBeGreaterThan(0);
  expect(lastEvent.error).toContain('500');
  
  console.log(`✓ Request correlation verified with ID: ${requestId}`);
  console.log(`✓ Telemetry event captured:`, lastEvent);
});

test('request correlation and data scrubbing via /debug/telemetry/last', async ({ page }) => {
  // Navigate to the web app
  await page.goto('/');
  
  // Verify the page loaded correctly
  await expect(page.locator('h1')).toContainText('QA Instrumentation Demo');
  
  // Send a telemetry event with sensitive data directly to test scrubbing
  const testRequestId = await page.evaluate(() => {
    const requestId = 'scrub-test-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    
    // Simulate sending telemetry with sensitive details
    fetch('/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        ts: Date.now(),
        level: 'error',
        env: 'development',
        release: 'local',
        route: '/test/scrubbing',
        status: 400,
        error_code: 'VALIDATION_ERROR',
        error: 'User data validation failed',
        details: {
          userEmail: 'sensitive.user@company.com',
          apiKey: 'sk-1234567890abcdef1234567890abcdef',
          password: 'supersecret123',
          authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          normalField: 'this should remain visible',
          longString: 'a'.repeat(600), // Should be truncated
          nestedData: {
            email: 'nested@example.com',
            secretKey: 'secret-value-123',
            publicInfo: 'visible data'
          }
        }
      })
    }).catch(() => {
      // Ignore fetch errors for this test
    });
    
    return requestId;
  });
  
  // Wait for telemetry to be processed
  await page.waitForTimeout(1000);
  
  // Fetch the last telemetry event using the new endpoint
  const response = await page.request.get('http://localhost:3000/debug/telemetry/last');
  expect(response.status()).toBe(200);
  
  const lastEvent = await response.json();
  
  // 1. Assert request_id correlation (should match our test request)
  expect(lastEvent.request_id).toBe(testRequestId);
  
  // 2. Assert event structure
  expect(lastEvent).toMatchObject({
    level: 'error',
    route: '/test/scrubbing',
    status: 400,
    error_code: 'VALIDATION_ERROR',
  });
  
  // 3. Verify details field exists and was scrubbed
  expect(lastEvent.details).toBeDefined();
  
  // 4. Assert data scrubbing - emails should be redacted
  expect(lastEvent.details.userEmail).toBe('***@company.com');
  expect(lastEvent.details.nestedData.email).toBe('***@example.com');
  
  // 5. Assert sensitive keys are redacted
  expect(lastEvent.details.apiKey).toBe('[REDACTED]');
  expect(lastEvent.details.password).toBe('[REDACTED]');
  expect(lastEvent.details.authToken).toBe('[REDACTED]');
  expect(lastEvent.details.nestedData.secretKey).toBe('[REDACTED]');
  
  // 6. Assert normal data is preserved
  expect(lastEvent.details.normalField).toBe('this should remain visible');
  expect(lastEvent.details.nestedData.publicInfo).toBe('visible data');
  
  // 7. Assert long string truncation
  expect(lastEvent.details.longString).toHaveLength(500);
  expect(lastEvent.details.longString).toMatch(/\.\.\.$/); // Should end with ...
  
  console.log(`✓ Request correlation verified with ID: ${testRequestId}`);
  console.log(`✓ Data scrubbing verified:`, JSON.stringify(lastEvent.details, null, 2));
});