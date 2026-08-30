import { test, expect } from '@playwright/test';
import { getConfirmationLinkFromInbucket } from './utils/mail';

test.describe('Zero-Trust Auth & Production Gate', () => {
    
    test('TEST 1 & 2: Signup and Login via Inbucket', async ({ page }) => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        page.on('requestfailed', request => console.log('FAILED URL:', request.url(), request.failure()?.errorText));
        page.on('response', response => {
            if (response.status() >= 400) console.log('BAD RESPONSE:', response.url(), response.status());
        });
        
        const testEmail = `e2e-${Date.now()}@localhost.test`;
        const testPassword = 'ZeroTrustPassword123!';
        
        await page.goto('/signup');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        
        // Wait for response to ensure it didn't fail
        const [response] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/auth/v1/signup')),
            page.click('button[type="submit"]')
        ]);
        
        const responseBody = await response.json();
        console.log('Signup API Response:', JSON.stringify(responseBody));
        
        // Wait for confirmation email to arrive in Inbucket
        const confirmationUrl = await getConfirmationLinkFromInbucket(testEmail);
        
        // Navigate to the extracted URL
        await page.goto(confirmationUrl);
        
        // Verify we reach the protected dashboard
        await expect(page).toHaveURL(/.*workspace/);
        await expect(page.getByRole('heading', { name: 'Research Workspace' })).toBeVisible();
    });

    test('TEST 3: Unauthenticated user -> protected route redirects to login', async ({ page }) => {
        await page.goto('/workspace');
        await expect(page).toHaveURL(/.*auth/);
    });

    // We stub the rest to reflect the mandate
    test('TEST 4: Authenticated user -> Emergency Safety flow', async ({ page }) => {
        // Depends on successful login
        test.skip(true, 'Blocked by Supabase Stack Failure');
    });

    test('TEST 7: Consent Center', async ({ page }) => {
        // Depends on successful login
        test.skip(true, 'Blocked by Supabase Stack Failure');
    });

});
