import { test, expect } from '@playwright/test';

test.describe('Phase 12 — Final Product Experience, Demo Readiness & Impact Intelligence E2E Suite', () => {
  test('Scenario 1: Landing Page First Impression & Onboarding Modal', async ({ page }) => {
    // Pre-set localStorage to avoid auto-show timer race condition
    await page.addInitScript(() => {
      window.localStorage.setItem('nyaya_onboarded_v1', 'true');
    });

    await page.goto('/');

    // Check Hero title and safety disclaimer
    await expect(page.locator('h1')).toContainText('Your Legal Problem.');
    await expect(page.locator('h1')).toContainText('Your Next Step.');
    await expect(page.getByText('Nyaya AI provides informational and organizational assistance').first()).toBeVisible();

    // Check How Nyaya Works onboarding trigger button
    const onboardingBtn = page.getByRole('button', { name: 'How Nyaya Works' });
    await expect(onboardingBtn).toBeVisible();
    await onboardingBtn.click();

    // Onboarding modal should render
    await expect(page.getByText('Welcome to Nyaya AI')).toBeVisible();
    await expect(page.getByText('Tell Nyaya what happened')).toBeVisible();

    // Skip onboarding
    await page.getByText('Skip Onboarding').click();
    await expect(page.getByText('Welcome to Nyaya AI')).not.toBeVisible();
  });

  test('Scenario 2: Demo Mode Walkthrough & Scenario Switching', async ({ page }) => {
    await page.goto('/demo');

    // Verify Demo Mode Banner
    await expect(page.getByText('DEMO / SAMPLE CASE MODE')).toBeVisible();
    await expect(page.getByText('Illustrative Data Only')).toBeVisible();

    // Verify Scenario Selector
    await expect(page.getByRole('button', { name: 'Tenant-Landlord Deposit Dispute' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Employment Salary & Notice Pay Recovery' })).toBeVisible();

    // Switch scenario
    await page.getByRole('button', { name: 'Employment Salary & Notice Pay Recovery' }).click();
    await expect(page.getByText('Employment Salary & Notice Pay Recovery').first()).toBeVisible();
  });

  test('Scenario 3: Case Dashboard 5 Citizen Questions & Explainability Layer', async ({ page }) => {
    await page.goto('/cases/case-1');

    // 1. What Should I Do Next? (Prioritized at top)
    await expect(page.getByText('Current Case Stage & Status')).toBeVisible();
    await expect(page.getByText('Upload Evidence Documents')).toBeVisible();

    // 2. Pre-litigation Checkpoint
    await expect(page.getByText('Pre-Litigation Checkpoint')).toBeVisible();
    await expect(page.getByText('Before filing a case in court')).toBeVisible();

    // 3. Facts & Chronology
    await expect(page.getByText('Facts & Case Details')).toBeVisible();

    // 4. Evidence & Readiness
    await expect(page.getByText('Document Readiness & Evidence Audit')).toBeVisible();
    await expect(page.getByText('Categorical Case Readiness')).toBeVisible();

    // 5. Layered Legal Analysis
    await expect(page.getByText('Layered Preliminary Legal Analysis')).toBeVisible();
    await expect(page.getByText('Level 1 — Plain-Language Explanation')).toBeVisible();

    // 6. Resolution Pathways & "Why This Path?" Explainability
    await expect(page.getByText('Resolution Pathways & Explainability')).toBeVisible();
    await expect(page.getByText('Why Nyaya suggests exploring this:').first()).toBeVisible();

    // 7. Systemic Pendency Impact
    await expect(page.getByText('Why Resolution Before Litigation Matters')).toBeVisible();

    // 8. Factual Delay Intelligence
    await expect(page.getByText('Delay Intelligence & Factual Hearing Log')).toBeVisible();
  });

  test('Scenario 4: Trust & Safety Center', async ({ page }) => {
    await page.goto('/trust');

    await expect(page.getByRole('heading', { name: 'How Nyaya AI Works' })).toBeVisible();
    await expect(page.getByText('AI Boundaries & Transparency')).toBeVisible();
    await expect(page.getByText('Confidentiality & Zero Public Training')).toBeVisible();
    await expect(page.getByText('No Win Probability Claims')).toBeVisible();
  });

  test('Scenario 5: Judge-Ready Case Package Disclaimers', async ({ page }) => {
    await page.goto('/cases/case-1/case-package');

    await expect(page.getByText('Mandatory Disclosure & Legal Status')).toBeVisible();
    await expect(page.getByText('Requires qualified advocate review before filing')).toBeVisible();
  });
});
