import { test, expect } from '@playwright/test';

test.describe('Chat Routing Tests', () => {

  test('TEST A: GENERAL RTI', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Type and press enter, handle textarea or input
    const input = page.locator('textarea').first();
    await input.fill('How do I file an RTI application?');
    await input.press('Enter');
    
    // Wait for the AI to respond fully
    await page.waitForTimeout(10000);
    
    const messages = await page.locator('.prose, .message-content, p').allInnerTexts();
    const latestMessage = messages[messages.length - 1];
    console.log("TEST A Response:", latestMessage);
    
    expect(latestMessage).not.toContain("Could you provide more details about the incident?");
  });

  test('TEST B & C: PERSONAL LEGAL PROBLEM AND CONTEXT', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('textarea').first();
    await input.fill('My landlord illegally locked me out of my rented house.');
    await input.press('Enter');
    
    await page.waitForTimeout(10000);
    
    let messages = await page.locator('.prose, .message-content, p').allInnerTexts();
    let latestMessage = messages[messages.length - 1];
    console.log("TEST B Response:", latestMessage);
    
    expect(latestMessage).not.toBe("Could you provide more details about the incident?");
    
    // TEST C
    await input.fill('18 August 2026 at 11:20 PM');
    await input.press('Enter');
    
    await page.waitForTimeout(10000);
    
    messages = await page.locator('.prose, .message-content, p').allInnerTexts();
    latestMessage = messages[messages.length - 1];
    console.log("TEST C Response:", latestMessage);
    
    expect(latestMessage.toLowerCase()).not.toContain('when did your landlord');
    expect(latestMessage.toLowerCase()).not.toContain('exact date');
  });

  test('TEST D: SECTION 138 (GENERAL)', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('textarea').first();
    await input.fill('What is Section 138 of the Negotiable Instruments Act?');
    await input.press('Enter');
    
    await page.waitForTimeout(10000);
    
    const messages = await page.locator('.prose, .message-content, p').allInnerTexts();
    const latestMessage = messages[messages.length - 1];
    console.log("TEST D Response:", latestMessage);
    
    expect(latestMessage).not.toContain("Could you provide more details");
  });
});
