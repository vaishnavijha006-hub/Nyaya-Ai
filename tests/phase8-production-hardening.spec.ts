import { test, expect } from '@playwright/test';

test.describe('Phase 8 — Production Hardening, Security & Reliability E2E Suite', () => {
  test('Test 1: Server-Side & Route Authorization Protection', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('domcontentloaded');
    // Protected workspace route redirects to /auth when unauthenticated
    await expect(page).toHaveURL(/.*auth/);
  });

  test('Test 2: Legal Safety & AI Disclaimer Verification', async ({ page }) => {
    await page.goto('/cases/case-1/settlement');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Voluntary Settlement Exploration')).toBeVisible({ timeout: 10000 });
    // Verify mandatory legal safety disclaimer is rendered
    await expect(page.locator('text=does not constitute a court order').first()).toBeVisible();
  });

  test('Test 3: Qualitative Readiness Overview (Zero Win Probability Claims)', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Case Readiness Overview')).toBeVisible({ timeout: 10000 });
    const content = await page.content();
    expect(content).not.toContain('94% chance of winning');
    expect(content).not.toContain('guaranteed outcome');
  });

  test('Test 4: Intelligence & Privacy PII Masking Guarantee', async ({ page }) => {
    await page.goto('/intelligence');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=ANONYMISED PATTERN ANALYSIS & PRIVACY GUARANTEE')).toBeVisible({ timeout: 10000 });
    const textContent = await page.innerText('body');
    // Verify PII identifiers are not exposed in anonymised patterns
    expect(textContent).not.toMatch(/\b[A-Z]{5}\d{4}[A-Z]{1}\b/); // PAN
    expect(textContent).not.toMatch(/\b\d{4}\s?\d{4}\s?\d{4}\b/); // Aadhaar
  });

  test('Test 5: Mobile Viewport Responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Case Details: case-1')).toBeVisible({ timeout: 10000 });
  });
});
