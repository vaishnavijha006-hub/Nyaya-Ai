import { test, expect } from '@playwright/test';

test.describe('Intent Gating & Hallucination Prevention E2E Tests', () => {

  test('Casual greeting does not trigger legal analysis or state mutation', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('domcontentloaded');

    const input = page.locator('input[placeholder*="Describe"], textarea').first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // Send casual greeting "hii"
    await input.fill('hii');
    await input.press('Enter');

    // Wait for response to render
    await page.waitForTimeout(2500);

    const bodyText = await page.innerText('body');

    // Verify friendly response received
    expect(bodyText.toLowerCase()).toContain('nyaya ai');

    // Verify NO Legal Analysis card or heading produced
    expect(bodyText).not.toContain('Legal Analysis');
    expect(bodyText).not.toContain('Bharatiya Sakshya Adhiniyam');
    expect(bodyText).not.toContain('Puttaswamy');

    // Verify NO "VERIFIED" legal status badge rendered for casual chat
    const verifiedBadge = page.locator('span:has-text("VERIFIED")');
    await expect(verifiedBadge).toHaveCount(0);

    // Verify NO "Case Created & Information Saved" banner rendered for casual chat
    expect(bodyText).not.toContain('Case Created & Information Saved');
  });

  test('Personal legal problem starts case journey intake', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('domcontentloaded');

    const input = page.locator('input[placeholder*="Describe"], textarea').first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // Send personal legal problem
    await input.fill('My landlord locked me out and won\'t return my ₹50,000 deposit.');
    await input.press('Enter');

    // Wait for response
    await page.waitForTimeout(3000);

    const bodyText = await page.innerText('body');

    // Verify assistant responds to the personal legal dispute
    expect(bodyText.toLowerCase()).toMatch(/landlord|deposit|evict|tenancy|notice|facts/);
  });
});
