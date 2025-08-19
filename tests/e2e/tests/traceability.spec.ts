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

test('API telemetry scrubbing and validation contract', async ({ page }) => {
  // Navigate to ensure we have proper context
  await page.goto('/');
  
  // Test the API's telemetry scrubbing behavior directly (this is valid since it's an API contract test)
  const testRequestId = 'scrub-contract-' + Date.now();
  
  // Send a telemetry event with sensitive data to verify the API contract
  const telemetryResponse = await page.request.post('http://localhost:3000/telemetry', {
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': testRequestId,
    },
    data: {
      ts: Date.now(),
      level: 'error',
      env: 'development',
      release: 'local',
      route: '/api/sensitive-operation',
      status: 400,
      error_code: 'VALIDATION_ERROR',
      error: 'User data validation failed',
      details: {
        // These represent data that COULD realistically be in error details
        userEmail: 'user@company.com',          // Email in error context
        apiKey: 'sk-1234567890abcdef1234',      // API key accidentally logged
        bearerToken: 'Bearer abc123def456',      // Auth token in error
        password: 'leaked-password',             // Password in form data
        normalField: 'safe-to-log',             // Non-sensitive data
        errorContext: 'Form validation failed', // Normal error context
        longTrace: 'x'.repeat(600)              // Long stack trace
      }
    }
  });
  
  // Verify telemetry was accepted
  expect(telemetryResponse.status()).toBe(204);
  
  // Fetch the processed event to verify scrubbing worked
  const debugResponse = await page.request.get('http://localhost:3000/debug/telemetry/last');
  expect(debugResponse.status()).toBe(200);
  
  const scrubbedEvent = await debugResponse.json();
  
  // 1. Verify request correlation 
  expect(scrubbedEvent.request_id).toBe(testRequestId);
  
  // 2. Verify event structure is preserved
  expect(scrubbedEvent).toMatchObject({
    level: 'error',
    route: '/api/sensitive-operation',
    status: 400,
    error_code: 'VALIDATION_ERROR',
  });
  
  // 3. CRITICAL: Verify sensitive data was scrubbed
  expect(scrubbedEvent.details.userEmail).toBe('***@company.com');      // Email redacted
  expect(scrubbedEvent.details.apiKey).toBe('[REDACTED]');              // API key redacted  
  expect(scrubbedEvent.details.bearerToken).toBe('[REDACTED]');         // Token redacted
  expect(scrubbedEvent.details.password).toBe('[REDACTED]');            // Password redacted
  
  // 4. CRITICAL: Verify safe data was preserved
  expect(scrubbedEvent.details.normalField).toBe('safe-to-log');
  expect(scrubbedEvent.details.errorContext).toBe('Form validation failed');
  
  // 5. CRITICAL: Verify string truncation works
  expect(scrubbedEvent.details.longTrace).toHaveLength(500);
  expect(scrubbedEvent.details.longTrace).toMatch(/\.\.\.$/);
  
  // 6. Verify no raw sensitive data leaked anywhere in the response
  const eventString = JSON.stringify(scrubbedEvent);
  expect(eventString).not.toContain('user@company.com');               // Original email should not appear
  expect(eventString).not.toContain('sk-1234567890abcdef1234');        // Original API key should not appear
  expect(eventString).not.toContain('leaked-password');                // Original password should not appear
  
  console.log(`✓ API scrubbing contract verified with ID: ${testRequestId}`);
  console.log(`✓ Sensitive data properly redacted:`, scrubbedEvent.details);
});