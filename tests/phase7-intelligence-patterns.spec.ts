import { test, expect } from '@playwright/test';

test.describe('Phase 7 — Intelligence & Systemic Impact Center E2E Suite', () => {
  test('Scenario 1: Navigation & Intelligence Center Render', async ({ page }) => {
    await page.goto('/intelligence');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Patterns Across Cases')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=ANONYMISED PATTERN ANALYSIS & PRIVACY GUARANTEE')).toBeVisible();
    await expect(page.locator('text=Cases Analysed')).toBeVisible();
    await expect(page.locator('text=1,248')).toBeVisible();
  });

  test('Scenario 2: Pattern Discovery & Cards', async ({ page }) => {
    await page.goto('/intelligence');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Repeated Security Deposit Withholding')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=42 Similar Cases')).toBeVisible();
    await expect(page.locator('text=Pre-Litigation Settlement').first()).toBeVisible();
  });

  test('Scenario 3: Pattern Detail Page & 10-Section Breakdown', async ({ page }) => {
    await page.goto('/intelligence/pat-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Repeated Security Deposit Withholding (pat-1)')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=WHY AM I SEEING THIS PATTERN?')).toBeVisible();
    await expect(page.locator('text=What Cases Have In Common:')).toBeVisible();
    await expect(page.locator('text=What Makes These Cases Different:')).toBeVisible();
  });

  test('Scenario 4: Anonymised Similar Case References (Zero PII Exposure)', async ({ page }) => {
    await page.goto('/intelligence/pat-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Anonymised Similar Case References')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Case #NY-1042')).toBeVisible();
    await expect(page.locator('text=Case #NY-1088')).toBeVisible();
  });

  test('Scenario 5: PIL Suitability & Systemic Action Disclaimers', async ({ page }) => {
    await page.goto('/intelligence/pat-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=PIL Suitability Assessment')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Why this does NOT automatically mean a PIL should be filed:')).toBeVisible();
    await expect(page.locator('text=Systemic Action & Broader Resolution Routes')).toBeVisible();
  });

  test('Scenario 6: Case Page -> Related Patterns Linking', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Related Systemic Patterns')).toBeVisible({ timeout: 10000 });
    const viewButton = page.locator('a', { hasText: 'View Pattern' }).first();
    await expect(viewButton).toBeVisible();
  });
});
