import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Full Review Cycle — Multi-Role Integration', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('researcher can see submitted paper on dashboard', async ({ page, context }) => {
    const data = await seedScenario('submitted-paper', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');

    // Should see the submitted paper
    const prefix = testRunId.slice(0, 8);
    await expect(
      page.locator(`text=Registered Paper ${prefix}`).or(page.locator('text=submitted'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('editor sees incoming submission and can publish criteria', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    // Editor views incoming
    await loginAs(page, context, data.editorWallet as string, 'editor');

    // Paper should be visible
    const paperCards = page.locator(sel.PAPER_CARD);
    await expect(paperCards.first()).toBeVisible({ timeout: 10_000 });
    await paperCards.first().click();

    // Criteria builder should appear
    await expect(page.locator(sel.CRITERIA_BUILDER)).toBeVisible({ timeout: 5_000 });

    // Fill criterion and publish
    const criterionInput = page.locator(sel.CRITERION_ROW).first().locator('input[type="text"]');
    await criterionInput.fill('Is the methodology sound?');
    await page.locator(sel.PUBLISH_CRITERIA_BTN).click();

    // Wait for published confirmation
    await expect(page.locator('text=Criteria published')).toBeVisible({ timeout: 10_000 });
  });

  test('reviewer can submit a complete review', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    // Login as reviewer1 (accepted assignment)
    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');

    // Click assigned paper
    const paperCards = page.locator(sel.PAPER_CARD);
    await paperCards.first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Fill all criteria with "Yes"
    const criterionEvals = page.locator(sel.CRITERION_EVAL);
    const count = await criterionEvals.count();
    for (let i = 0; i < count; i++) {
      await criterionEvals.nth(i).locator('button:has-text("Yes")').click();
    }

    // Fill strengths
    await page.locator(sel.STRENGTHS_INPUT + ' textarea').fill('Excellent work.');

    // Select recommendation
    await page.locator(sel.RECOMMENDATION_SELECT + ' select').selectOption('Accept');

    // Submit
    const submitBtn = page.locator(sel.SUBMIT_REVIEW_BTN);
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Should show confirmation
    await expect(
      page.locator('text=submitted').or(page.locator('text=Submitted')).or(page.locator('text=Review Submission'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('editor can release decision after reviews', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    // Editor makes decision
    await loginAs(page, context, data.editorWallet as string, 'editor');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.DECISION_PANEL)).toBeVisible({ timeout: 5_000 });

    // Select Accept
    const decisionSelect = page.locator(sel.DECISION_PANEL + ' select');
    await decisionSelect.selectOption('accept');

    // Release
    const releaseBtn = page.locator(sel.RELEASE_DECISION_BTN);
    await expect(releaseBtn).toBeEnabled();
    await releaseBtn.click();

    // Should show loading
    await expect(releaseBtn).toHaveText(/Releasing/);
  });
});
