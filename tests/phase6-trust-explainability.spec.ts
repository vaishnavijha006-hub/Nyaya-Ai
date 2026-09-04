import { test, expect } from '@playwright/test';

test.describe('Phase 6 — Trust, Evidence & Explainability E2E Suite', () => {
  test('Test 1 & 7: Case Trust Summary & Audit Trail', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Case Information & Trust Status')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Case Audit Trail')).toBeVisible();
    await expect(page.locator('text=Actor-Tagged History')).toBeVisible();
  });

  test('Test 3: Conflicting Facts Surfaced', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=INFORMATION CONFLICT DETECTED')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Deposit Payment Date')).toBeVisible();
    await expect(page.locator('text=Silent overwriting is prevented')).toBeVisible();
  });

  test('Test 5: Recommendation Explanation Displays', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=WHY THIS RECOMMENDATION?')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Factors Considered:')).toBeVisible({ timeout: 10000 });
  });

  test('Test 6: Statutory Source vs AI Interpretation', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Transfer of Property Act, 1882').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=STATUTORY TEXT')).toBeVisible();
    await expect(page.locator('text=AI INTERPRETATION')).toBeVisible();
  });
});
