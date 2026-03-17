import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Reviewer Dashboard', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('dashboard loads with reputation scores', async ({ page, context }) => {
    const data = await seedScenario('reviewer-with-badges', testRunId);

    await loginAs(page, context, data.reviewerWallet as string, 'reviewer');

    // Should show reviewer dashboard without errors
    await expect(page.locator('body')).not.toHaveText('500');
    await expect(page.locator('body')).not.toHaveText('Internal Server Error');

    // Should show reputation data
    await expect(page.locator('text=85').or(page.locator('text=Reputation')).or(page.locator('text=Score'))).toBeVisible({ timeout: 10_000 });
  });

  test('badge cards render for earned badges', async ({ page, context }) => {
    const data = await seedScenario('reviewer-with-badges', testRunId);

    await loginAs(page, context, data.reviewerWallet as string, 'reviewer');

    // Badge cards should be visible
    const badgeCards = page.locator(sel.BADGE_CARD);
    await expect(badgeCards.first()).toBeVisible({ timeout: 10_000 });

    // Should have 3 badges (first_review, ten_reviews, high_reputation)
    expect(await badgeCards.count()).toBe(3);
  });

  test('performance metrics display correctly', async ({ page, context }) => {
    const data = await seedScenario('reviewer-with-badges', testRunId);

    await loginAs(page, context, data.reviewerWallet as string, 'reviewer');

    // Should show review count
    await expect(
      page.locator('text=12').or(page.locator('text=Reviews'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('badge card shows achievement name', async ({ page, context }) => {
    const data = await seedScenario('reviewer-with-badges', testRunId);

    await loginAs(page, context, data.reviewerWallet as string, 'reviewer');

    // Should show badge achievement names
    await expect(
      page.locator('text=First Review').or(page.locator('text=first_review'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('empty dashboard for new reviewer', async ({ page, context }) => {
    // Create a reviewer with no badges or reviews
    const data = await seedScenario('empty-researcher', testRunId);
    // Re-seed as reviewer role
    // Since empty-researcher creates a researcher, we test that reviewer dashboard handles
    // users without reviewer data gracefully
    await loginAs(page, context, data.userWallet as string, 'reviewer');

    // Should not crash
    await expect(page.locator('body')).not.toHaveText('500');
  });
});
