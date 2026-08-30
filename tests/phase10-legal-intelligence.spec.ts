import { test, expect } from '@playwright/test';

test.describe('Phase 10 — Legal Intelligence, Grounding & End-to-End Journey E2E Suite', () => {
  test('Scenario 1: Fact Confirmation Card Renders on Case Workspace', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Fact Understanding & Confirmation')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Security Deposit Paid:').first()).toBeVisible();
    await expect(page.locator('text=₹50,000').first()).toBeVisible();
  });

  test('Scenario 2: Citizen Fact Confirmation Action', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
    await expect(confirmButton).toBeVisible({ timeout: 10000 });
    await confirmButton.click();
    await expect(page.locator('text=Confirmed').first()).toBeVisible();
  });

  test('Scenario 3: Statutory Legal Source Grounding & Traceability', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Statutory Legal Source Grounding')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Transfer of Property Act, 1882 — Section 108')).toBeVisible();
    await expect(page.locator('text=Consumer Protection Act, 2019 — Section 2(11)')).toBeVisible();
    await expect(page.locator('text=Facts Used: Rent Agreement + ₹50,000 Payment Receipt')).toBeVisible();
  });
});
