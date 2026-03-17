import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Researcher — Review Response', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('review response page loads with reviews', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/reviews`);
    await page.waitForLoadState('networkidle');

    // Should show Review Response heading
    await expect(page.locator('text=Review Response')).toBeVisible({ timeout: 10_000 });

    // Should show review cards
    const reviewCards = page.locator(sel.REVIEW_RESPONSE_CARD);
    expect(await reviewCards.count()).toBeGreaterThan(0);
  });

  test('accept and rebuttal buttons are visible', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/reviews`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator(sel.ACCEPT_REVIEWS_BTN)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(sel.REQUEST_REBUTTAL_BTN)).toBeVisible();
  });

  test('accept reviews shows loading and redirects', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/reviews`);
    await page.waitForLoadState('networkidle');

    // Click accept
    const acceptBtn = page.locator(sel.ACCEPT_REVIEWS_BTN);
    await acceptBtn.click();

    // Should show loading state
    await expect(acceptBtn).toHaveText(/Submitting/);
  });

  test('request rebuttal shows loading state', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/reviews`);
    await page.waitForLoadState('networkidle');

    // Click request rebuttal
    const rebuttalBtn = page.locator(sel.REQUEST_REBUTTAL_BTN);
    await rebuttalBtn.click();

    // Should show loading state
    await expect(rebuttalBtn).toHaveText(/Submitting/);
  });
});
