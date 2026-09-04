import { test, expect } from '@playwright/test';

test.describe('Phase 14 — NJDG / eCourts Case Lookup & Delay Intelligence Integration', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('nyaya_onboarded_v1', 'true');
    });

    // Mock backend endpoint `/api/court-data/case-lookup` for E2E webServer context
    await page.route('**/api/court-data/case-lookup*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          identifier: 'UPGB010012342024',
          identifier_type: 'CNR',
          source: 'Official eCourts/NJDG API (Demo Simulation)',
          source_mode: 'DEMO',
          court_data: {
            identifier: 'UPGB010012342024',
            identifier_type: 'CNR',
            court: 'District & Sessions Court, Ghaziabad',
            case_number: 'Suit No. 1234/2024',
            case_type: 'Civil Dispute (Recovery & Tenancy)',
            filing_date: '2026-01-15',
            status: 'Pending (Evidence Recording)',
            hearing_history: [
              { hearing_id: 'h_1', hearing_date: '2026-01-20', stage: 'Filing & Registration', outcome: 'Registered & Summons Issued' },
              { hearing_id: 'h_2', hearing_date: '2026-03-10', stage: 'Appearance of Respondent', outcome: 'Adjourned', adjournment_reason: 'W.S. not filed by Respondent' },
              { hearing_id: 'h_3', hearing_date: '2026-04-25', stage: 'Evidence Verification', outcome: 'Adjourned', adjournment_reason: 'Witness unavailable' }
            ]
          },
          delay_report: {
            total_case_age: '120 days',
            number_of_hearings: 3,
            number_of_adjournments: 2,
            recorded_delay: '76 days',
            delay_trend: 'Moderate Scheduling Delays',
            estimated_impact: 'Based on recorded case history, each adjournment adds an estimated impact of approximately 38 days.',
            court_grant_disclaimer: 'The system does not judge whether an adjournment was legally justified. It only analyzes recorded information.'
          },
          disclaimer: 'This system displays data retrieved from official court records or user-reported inputs. Nyaya AI does not judge whether adjournments or delays were legally justified.'
        })
      });
    });
  });

  test('TEST 1: Court record lookup UI elements render on case detail page', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');

    // Section header
    await expect(page.getByText('Official eCourts / NJDG Case Record Lookup')).toBeVisible();

    // Input field with data-testid="cnr-input"
    const cnrInput = page.locator('[data-testid="cnr-input"]');
    await expect(cnrInput).toBeVisible();

    // Fetch button with data-testid="fetch-cnr-button"
    const fetchBtn = page.locator('[data-testid="fetch-cnr-button"]');
    await expect(fetchBtn).toBeVisible();
  });

  test('TEST 2: Empty or invalid identifier triggers clean validation message', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');

    const fetchBtn = page.locator('[data-testid="fetch-cnr-button"]');
    await fetchBtn.scrollIntoViewIfNeeded();
    await fetchBtn.click();

    // Error alert
    await expect(page.getByText('Please enter a 16-character CNR number or Court Case Number.')).toBeVisible();
  });

  test('TEST 3: End-to-end CNR lookup fetches case details and updates Delay Intelligence', async ({ page }) => {
    await page.goto('/cases/case-1');
    await page.waitForLoadState('domcontentloaded');

    const cnrInput = page.locator('[data-testid="cnr-input"]');
    await cnrInput.scrollIntoViewIfNeeded();
    await cnrInput.fill('UPGB010012342024');
    await cnrInput.press('Enter');

    const fetchBtn = page.locator('[data-testid="fetch-cnr-button"]');
    await fetchBtn.scrollIntoViewIfNeeded();
    if (await fetchBtn.isVisible()) {
      await fetchBtn.click().catch(() => {});
    }

    // Wait for result container
    const resultBox = page.locator('[data-testid="court-lookup-result"]');
    await expect(resultBox).toBeVisible({ timeout: 10000 });

    // Verify source badge (Live/Demo or Fallback user-reported)
    await expect(resultBox.getByText(/Source:/i).first()).toBeVisible();

    // Verify court metadata
    await expect(page.getByText('CNR: UPGB010012342024')).toBeVisible();
    await expect(page.getByText('Delay Intelligence Analysis')).toBeVisible();
    await expect(page.getByText('Fetched Hearing History')).toBeVisible();

    // Verify legal disclaimer presence
    await expect(page.getByText(/Nyaya AI does not judge whether adjournments or delays were legally justified/i)).toBeVisible();
  });

});
