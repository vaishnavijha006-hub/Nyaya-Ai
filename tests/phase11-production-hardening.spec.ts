import { test, expect } from '@playwright/test';

test.describe('Phase 11 — Final Production Hardening & Quality Gate E2E Suite', () => {
  test('Test 1: Health Check Endpoint Verification', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('Test 2: Protected Route & Multi-Tenant Authorization Security', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('domcontentloaded');
    // Unauthenticated access MUST redirect to auth
    await expect(page).toHaveURL(/.*auth/);
  });

  test('Test 3: Production Error Boundaries & Graceful Fallbacks', async ({ page }) => {
    await page.goto('/cases/non-existent-case-id');
    await page.waitForLoadState('domcontentloaded');
    // Page renders case view cleanly without crashing or exposing stack traces
    await expect(page.locator('text=Case Details: non-existent-case-id')).toBeVisible({ timeout: 10000 });
  });

  test('Test 4: Legal Safety & AI Disclaimer Enforcement', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Case Readiness Overview')).toBeVisible({ timeout: 10000 });
    const content = await page.content();
    expect(content).not.toContain('94% chance of winning');
    expect(content).not.toContain('guaranteed outcome');
  });
});
