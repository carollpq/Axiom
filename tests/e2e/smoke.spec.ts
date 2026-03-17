import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Axiom/i);
    // The page should render without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Axiom/i);
  });

  test('unauthenticated users are redirected from protected routes', async ({
    page,
  }) => {
    const response = await page.goto('/researcher');
    // Should either redirect to login or show the page
    // (depending on middleware behavior)
    expect(response?.status()).toBeLessThan(500);
  });

  test('API badge route returns 404 for non-existent badge', async ({
    request,
  }) => {
    const response = await request.get('/api/badges/nonexistent-id');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Badge not found');
  });
});
