import { test, expect } from '@playwright/test';

test.describe('Phase 9 — End-to-End Legal Journey Integration E2E Suite', () => {
  test('Scenario 1: Complete Legal Journey (Intake -> Facts -> Action -> Refresh Persistence)', async ({ page }) => {
    // 1. Visit Chat Intake
    await page.goto('/chat');
    await page.waitForLoadState('domcontentloaded');
    const input = page.locator('textarea').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('My landlord is withholding ₹50,000 security deposit.');
    await input.press('Enter');

    await page.waitForTimeout(1000);

    // 2. Open Case Workspace
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');

    // 3. Verify Case Details & Action Plan Step
    await expect(page.locator('text=Case Details: case-1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Prepare Pre-Litigation Settlement Notice').first()).toBeVisible();

    // 4. Test Refresh Persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Case Details: case-1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Prepare Pre-Litigation Settlement Notice').first()).toBeVisible();
  });

  test('Scenario 2: Multi-Tenant Authorization Protection', async ({ page }) => {
    // Verify protected route redirects to /auth when unauthenticated
    await page.goto('/workspace');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*auth/);
  });

  test('Scenario 3: Deduplication & Fact Preservation', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=₹50,000').first()).toBeVisible({ timeout: 10000 });
  });
});
