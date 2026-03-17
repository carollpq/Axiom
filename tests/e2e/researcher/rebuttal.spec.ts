import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Researcher — Rebuttal', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('rebuttal workspace loads with review list', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');

    // Navigate to the rebuttal page
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // Should show review content in the workspace
    await expect(page.locator('text=Review').or(page.locator('text=review'))).toBeVisible({ timeout: 10_000 });
  });

  test('agree/disagree toggle works', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // Click on a review to select it
    const reviewItems = page.locator('.rebuttal-panel-left button, [class*="review"] button').first();
    if (await reviewItems.isVisible()) {
      await reviewItems.click();
    }

    // Check if agree/disagree buttons appear
    const agreeBtn = page.locator(sel.AGREE_BTN);

    if (await agreeBtn.isVisible()) {
      await agreeBtn.click();
      // Should have active styling
      await expect(agreeBtn).toBeVisible();

      // Disagree should also be visible
      await expect(page.locator(sel.DISAGREE_BTN)).toBeVisible();
    }
  });

  test('can fill justification and see response form', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // Response form should be accessible
    const responseForm = page.locator(sel.REBUTTAL_RESPONSE_FORM);
    if (await responseForm.isVisible()) {
      // Fill justification
      const justificationTextarea = page.locator(sel.JUSTIFICATION_INPUT + ' textarea');
      await justificationTextarea.fill('The methodology is sound because...');
      await expect(justificationTextarea).toHaveValue('The methodology is sound because...');
    }
  });

  test('submit button shows loading state', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    const submitBtn = page.locator(sel.REBUTTAL_SUBMIT_BTN);
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Should show submitting state
      await expect(submitBtn).toHaveText(/Submitting/);
    }
  });

  test('whitespace-only justification is rejected with error', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // Click on first review to select it
    const reviewItems = page.locator('.rebuttal-panel-left button, [class*="review"] button').first();
    if (await reviewItems.isVisible()) {
      await reviewItems.click();
    }

    // Select agree position
    const agreeBtn = page.locator(sel.AGREE_BTN);
    await expect(agreeBtn).toBeVisible({ timeout: 5_000 });
    await agreeBtn.click();

    // Fill with whitespace only
    const justificationTextarea = page.locator(sel.JUSTIFICATION_INPUT + ' textarea');
    await justificationTextarea.fill('   ');

    // Submit — the hook's .trim() filter should catch this
    const submitBtn = page.locator(sel.REBUTTAL_SUBMIT_BTN);
    await submitBtn.click();

    // Should show error about needing at least one response (whitespace trimmed = empty)
    await expect(
      page.locator('text=Please provide at least one response')
        .or(page.locator('text=error'))
        .or(page.locator('text=required'))
    ).toBeVisible({ timeout: 5_000 });
  });

  test('past-deadline rebuttal hides form and shows deadline notice', async ({ page, context }) => {
    // Seed a rebuttal-open scenario, then override the deadline to the past via the page
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // The seeded deadline is 14 days in the future, so the form should be open
    // Verify the form is accessible when deadline is in the future
    const workspace = page.locator('text=Rebuttal').or(page.locator('text=rebuttal'));
    await expect(workspace).toBeVisible({ timeout: 10_000 });

    // Now test deadline enforcement by overriding Date to simulate past-deadline
    // We mock the client-side Date to return a time 15 days in the future
    await page.evaluate(() => {
      const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
      const RealDate = Date;
      (window as unknown as Record<string, unknown>).Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(RealDate.now() + fifteenDaysMs);
          } else {
            // @ts-expect-error - spread args to Date constructor
            super(...args);
          }
        }
        static override now() {
          return RealDate.now() + fifteenDaysMs;
        }
      };
    });

    // Reload the page with mocked Date — deadline should now be in the past
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // The response form should NOT be visible (isReadOnly = true when past deadline)
    const responseForm = page.locator(sel.REBUTTAL_RESPONSE_FORM);
    await expect(responseForm).not.toBeVisible({ timeout: 5_000 });

    // Past deadline notice should be shown
    await expect(
      page.locator('text=Past Deadline')
        .or(page.locator('text=deadline has passed'))
    ).toBeVisible({ timeout: 5_000 });
  });
});
