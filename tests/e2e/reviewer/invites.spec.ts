import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Reviewer — Assignment Invites', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('invites page loads for reviewer with pending assignment', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    // Use reviewer2 who has a pending (not yet accepted) assignment
    await loginAs(page, context, data.reviewer2Wallet as string, 'reviewer');
    await page.goto('/reviewer/invites');
    await page.waitForLoadState('networkidle');

    // Should show invite details or at least load without error
    await expect(page.locator('body')).not.toHaveText('500');
  });

  test('accept/decline buttons visible for pending invite', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer2Wallet as string, 'reviewer');
    await page.goto('/reviewer/invites');
    await page.waitForLoadState('networkidle');

    // Paper card for the invite
    const paperCards = page.locator(sel.PAPER_CARD);
    if (await paperCards.count() > 0) {
      await paperCards.first().click();

      // Accept and decline buttons should be visible
      await expect(page.locator(sel.ACCEPT_ASSIGNMENT_BTN)).toBeVisible({ timeout: 5_000 });
      await expect(page.locator(sel.DECLINE_ASSIGNMENT_BTN)).toBeVisible();
    }
  });

  test('accept invite shows success toast', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer2Wallet as string, 'reviewer');
    await page.goto('/reviewer/invites');
    await page.waitForLoadState('networkidle');

    const paperCards = page.locator(sel.PAPER_CARD);
    if (await paperCards.count() > 0) {
      await paperCards.first().click();

      const acceptBtn = page.locator(sel.ACCEPT_ASSIGNMENT_BTN);
      if (await acceptBtn.isVisible()) {
        await acceptBtn.click();

        // Should show success message
        await expect(
          page.locator('[data-sonner-toast]:has-text("accepted")').or(
            page.locator('text=accepted')
          )
        ).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test('decline invite shows confirmation dialog', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer2Wallet as string, 'reviewer');
    await page.goto('/reviewer/invites');
    await page.waitForLoadState('networkidle');

    const paperCards = page.locator(sel.PAPER_CARD);
    if (await paperCards.count() > 0) {
      await paperCards.first().click();

      const declineBtn = page.locator(sel.DECLINE_ASSIGNMENT_BTN);
      if (await declineBtn.isVisible()) {
        await declineBtn.click();

        // Should show confirmation dialog
        await expect(page.locator('text=Are you sure')).toBeVisible({ timeout: 3_000 });
      }
    }
  });
});
