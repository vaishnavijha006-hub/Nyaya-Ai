import { test, expect } from '@playwright/test';

test.describe('Phase 5 — Action & Resolution Center E2E Suite', () => {
  test('Scenario 1 & 2: Open existing case & verify Action Center', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Case Details: case-1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=What can you do now?')).toBeVisible();
    await expect(page.locator('text=Prepare Pre-Litigation Settlement Notice').first()).toBeVisible();
  });

  test('Scenario 3: Resolution Pathways Display', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Available Resolution Pathways')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3', { hasText: 'Pre-Litigation Settlement' }).first()).toBeVisible();
    await expect(page.locator('text=Mediation / Lok Adalat (ADR)').first()).toBeVisible();
    await expect(page.locator('text=Government Legal Aid (DLSA)').first()).toBeVisible();
  });

  test('Scenario 4 & 5: Document Preparation & Readiness Overview', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Document Preparation Matrix')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Case Readiness Overview')).toBeVisible();
    await expect(page.locator('text=Rent Agreement Contract').first()).toBeVisible();
  });

  test('Scenario 6: Settlement Workflow Route', async ({ page }) => {
    await page.goto('/cases/case-1/settlement');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Resolve Dispute Out-Of-Court')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Proposed Settlement Terms')).toBeVisible();
    await expect(page.locator('text=Voluntary Settlement Exploration').first()).toBeVisible();
  });

  test('Scenario 7: Legal Aid Workflow Route', async ({ page }) => {
    await page.goto('/cases/case-1/legal-aid');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Section 12 Legal Aid Eligibility')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=District Legal Services Authority').first()).toBeVisible();
  });

  test('Scenario 8: Case Package Dossier Route', async ({ page }) => {
    await page.goto('/cases/case-1/case-package');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Case Package Readiness')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=80% (Prepared for Advocate Review)')).toBeVisible();
    await expect(page.locator('text=1. Executive Case Summary')).toBeVisible();
  });

  test('Scenario 9: Legal Safety & AI Disclaimer Check', async ({ page }) => {
    await page.goto('/cases/case-1/settlement');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Voluntary Settlement Exploration').first()).toBeVisible({ timeout: 10000 });
  });
});
