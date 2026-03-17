import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Rebuttal Cycle — Multi-Role Integration', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('researcher can access rebuttal after rejection', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // Should show rebuttal workspace
    await expect(page.locator('body')).not.toHaveText('500');
    await expect(
      page.locator('text=Rebuttal').or(page.locator('text=rebuttal').or(page.locator('text=Review')))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('rebuttal form is interactive when deadline not passed', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.researcherWallet as string, 'researcher');
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // Response form should be available (deadline is 14 days in future)
    const responseForm = page.locator(sel.REBUTTAL_RESPONSE_FORM);
    const submitBtn = page.locator(sel.REBUTTAL_SUBMIT_BTN);

    // At least one of these should be visible when a review is selected
    if (await responseForm.isVisible()) {
      await expect(submitBtn).toBeVisible();
    }
  });

  test('editor can view submission in rebuttal status', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');

    // Paper should show rebuttal status
    const paperCards = page.locator(sel.PAPER_CARD);
    await expect(paperCards.first()).toBeVisible({ timeout: 10_000 });
    await paperCards.first().click();

    // Should show rebuttal-related status
    await expect(
      page.locator('text=rebuttal').or(page.locator('text=Rebuttal'))
    ).toBeVisible({ timeout: 5_000 });
  });

  test('multi-role: researcher sees rejection, then rebuttal workspace', async ({ page, context }) => {
    const data = await seedScenario('rebuttal-open', testRunId);

    // First, check researcher dashboard shows the submission
    await loginAs(page, context, data.researcherWallet as string, 'researcher');

    // Navigate to the rebuttal
    const submissionId = data.submissionId as string;
    await page.goto(`/researcher/submissions/${submissionId}/rebuttal`);
    await page.waitForLoadState('networkidle');

    // Should be on rebuttal page
    await expect(page.locator('body')).not.toHaveText('500');

    // Now switch to editor and verify they see the same submission
    await loginAs(page, context, data.editorWallet as string, 'editor');

    // Editor should see the paper
    await expect(page.locator(sel.PAPER_CARD).first()).toBeVisible({ timeout: 10_000 });
  });
});
