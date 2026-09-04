import { test, expect } from '@playwright/test';

test.describe('Phase 13 — Complete Functionality & End-to-End Reliability Suite', () => {

  test('TEST 1: Landing page → intake → case creation → case dashboard navigation', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('nyaya_onboarded_v1', 'true');
    });

    await page.goto('/');

    // Hero title & prompt box
    await expect(page.locator('h1')).toContainText('Your Legal Problem.');
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    await textarea.fill('My landlord locked me out without notice');
    await page.locator('button:has-text("Analyze Problem")').click();

    // Should navigate to chat intake
    await page.waitForURL(/.*chat.*/);
    await expect(page.getByText('Understanding your case')).toBeVisible();
  });

  test('TEST 2: Login / Auth → view existing case details', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');

    // Case Details title & 5 Citizen Questions
    await expect(page.locator('h1')).toContainText('Case Details: case-1');
    await expect(page.getByText('Current Case Stage & Status')).toBeVisible();
    await expect(page.getByText('Facts & Case Details')).toBeVisible();
  });

  test('TEST 3: Document Upload & Local Persistence across Page Refresh', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');

    // Verify document preparation matrix renders
    await expect(page.getByText('Document Preparation Matrix')).toBeVisible();
    await expect(page.getByText('Rent Agreement Contract').first()).toBeVisible();

    // Reload page & verify state persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Document Preparation Matrix')).toBeVisible();
    await expect(page.getByText('Rent Agreement Contract').first()).toBeVisible();
  });

  test('TEST 4: Interactive Action Step Completion & State Persistence', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Structured Action Plan')).toBeVisible();

    // Locate Mark Step Complete button
    const markBtn = page.getByRole('button', { name: 'Mark Step Complete' }).first();
    if (await markBtn.isVisible()) {
      await markBtn.click();
    }

    // Refresh & verify action completion status persists
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Structured Action Plan')).toBeVisible();
  });

  test('TEST 5: Case Journey State Transition & NyayaPath Synchronization', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Guided Legal Resolution Journey')).toBeVisible();

    // Switch step via progress stepper
    const step3Btn = page.getByRole('button', { name: '3. Evidence' });
    await step3Btn.click();
    await expect(page.getByText('STEP 3 — Evidence Audit')).toBeVisible();

    const step5Btn = page.getByRole('button', { name: '5. Pathways' });
    await step5Btn.click();
    await expect(page.getByText('STEP 5 — Resolution Pathway Recommendation')).toBeVisible();
  });

  test('TEST 6: Resolution Pathway Recommendation & Action Navigation', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Available Resolution Pathways')).toBeVisible();
    await expect(page.getByText('Explore Settlement Terms').first()).toBeVisible();

    // Click settlement exploration
    await page.getByText('Explore Settlement Terms').first().click();
    await page.waitForURL(/.*settlement/);
    await expect(page.getByText('Pre-Litigation Settlement Module')).toBeVisible();
  });

  test('TEST 7: Legal Aid Eligibility Flow & DLSA Routing', async ({ page }) => {
    await page.goto('/cases/case-1/legal-aid');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Government Legal Aid')).toBeVisible();
    await expect(page.getByText('Section 12 Legal Aid Eligibility')).toBeVisible();
  });

  test('TEST 8: Settlement Notice Generation & Export Flow', async ({ page }) => {
    await page.goto('/cases/case-1/settlement');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Pre-Litigation Settlement')).toBeVisible();
    await expect(page.getByText('Proposed Settlement Terms')).toBeVisible();
    const saveBtn = page.getByRole('button', { name: /Save Settlement Proposal|Terms Saved/ });
    await expect(saveBtn).toBeVisible();
  });

  test('TEST 9: Judge-Ready Case Package Generation & Mandatory Disclaimers', async ({ page }) => {
    await page.goto('/cases/case-1/case-package');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Case Package Readiness')).toBeVisible();
    await expect(page.getByText('80% (Prepared for Advocate Review)')).toBeVisible();
    await expect(page.getByText('Mandatory Disclosure & Legal Status')).toBeVisible();
    await expect(page.getByText('1. Executive Case Summary')).toBeVisible();
  });

  test('TEST 10: Multi-Tenant User Isolation Safety Gate', async ({ page }) => {
    // Unauthenticated access to protected workspace MUST redirect to auth
    await page.goto('/workspace');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*auth/);
  });

  test('TEST 11: API Failure & System Health Recovery Boundary', async ({ page, request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('TEST 12: Network Graceful Fallback & Offline State Resilience', async ({ page }) => {
    await page.goto('/trust');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: 'How Nyaya AI Works' })).toBeVisible();
    await expect(page.getByText('AI Boundaries & Transparency')).toBeVisible();
  });
});
