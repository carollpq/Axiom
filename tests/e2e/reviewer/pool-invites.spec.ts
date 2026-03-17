import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';

let testRunId: string;

test.describe('Reviewer — Pool Invitations', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('empty state shows when no pool invites', async ({ page, context }) => {
    const data = await seedScenario('reviewer-with-badges', testRunId);

    await loginAs(page, context, data.reviewerWallet as string, 'reviewer');
    await page.goto('/reviewer/pool-invites');
    await page.waitForLoadState('networkidle');

    // Should show empty state
    await expect(page.locator('text=No pending invitations')).toBeVisible({ timeout: 10_000 });
  });

  test('pool invites page loads without errors', async ({ page, context }) => {
    const data = await seedScenario('reviewer-with-badges', testRunId);

    await loginAs(page, context, data.reviewerWallet as string, 'reviewer');
    await page.goto('/reviewer/pool-invites');
    await page.waitForLoadState('networkidle');

    // Should have the heading
    await expect(page.locator('text=Pool Invitations')).toBeVisible({ timeout: 10_000 });

    // No errors
    await expect(page.locator('body')).not.toHaveText('500');
  });
});
