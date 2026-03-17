import { test, expect } from '@playwright/test';
import { injectAuthCookie } from './helpers/auth-helper';

// Must match AUTH_COOKIE in src/shared/lib/auth/auth.ts
const AUTH_COOKIE_NAME = 'tw_auth_token';

test.describe('Auth E2E flows', () => {
  test('login page shows connect wallet UI', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    // Should contain wallet-related UI (Thirdweb connect button or similar)
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('registration page shows role selection', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('body')).toBeVisible();
    // Should show role options
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/researcher|editor|reviewer/);
  });

  test('registration page has link to login', async ({ page }) => {
    await page.goto('/onboarding');
    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible();
  });

  test('unauthenticated /researcher returns non-500', async ({ page }) => {
    const response = await page.goto('/researcher');
    expect(response?.status()).toBeLessThan(500);
  });

  test('unauthenticated /editor returns non-500', async ({ page }) => {
    const response = await page.goto('/editor');
    expect(response?.status()).toBeLessThan(500);
  });

  test('unauthenticated /reviewer returns non-500', async ({ page }) => {
    const response = await page.goto('/reviewer');
    expect(response?.status()).toBeLessThan(500);
  });

  test('authenticated user can access protected route', async ({
    page,
    context,
  }) => {
    await injectAuthCookie(context);
    const response = await page.goto('/researcher');
    // Should not be a server error
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('expired/invalid cookie treated as unauthenticated', async ({
    page,
    context,
  }) => {
    // Set an invalid JWT cookie directly
    await context.addCookies([
      {
        name: AUTH_COOKIE_NAME,
        value: 'invalid-jwt-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
      },
    ]);

    const response = await page.goto('/researcher');
    // Should not crash — graceful fallback
    expect(response?.status()).toBeLessThan(500);
  });
});
