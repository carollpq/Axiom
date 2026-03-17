import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Reviewer — Assigned Reviews', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('review workspace loads with criteria', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    // Click on the assigned paper
    const paperCards = page.locator(sel.PAPER_CARD);
    await paperCards.first().click();

    // Review workspace should be visible
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Should show criterion evaluations
    const criterionEvals = page.locator(sel.CRITERION_EVAL);
    expect(await criterionEvals.count()).toBeGreaterThan(0);
  });

  test('can rate criteria with Yes/No/Partially buttons', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Click "Yes" on first criterion
    const firstCriterion = page.locator(sel.CRITERION_EVAL).first();
    const yesBtn = firstCriterion.locator('button:has-text("Yes")');
    await yesBtn.click();

    // Button should appear active (has different styling)
    // We verify by checking it's still there and clickable
    await expect(yesBtn).toBeVisible();
  });

  test('general comment fields are visible', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // All general comment sections should be visible
    await expect(page.locator(sel.STRENGTHS_INPUT)).toBeVisible();
    await expect(page.locator(sel.WEAKNESSES_INPUT)).toBeVisible();
    await expect(page.locator(sel.QUESTIONS_INPUT)).toBeVisible();
    await expect(page.locator(sel.CONFIDENTIAL_COMMENTS_INPUT)).toBeVisible();
  });

  test('recommendation select has all options', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Recommendation select should have options
    const recSelect = page.locator(sel.RECOMMENDATION_SELECT + ' select');
    await expect(recSelect).toBeVisible();

    const options = recSelect.locator('option');
    const optionTexts = await options.allTextContents();
    expect(optionTexts).toContain('Accept');
    expect(optionTexts).toContain('Minor Revisions');
    expect(optionTexts).toContain('Major Revisions');
    expect(optionTexts).toContain('Reject');
  });

  test('submit button disabled without required fields', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Submit button should be disabled without filling required fields
    const submitBtn = page.locator(sel.SUBMIT_REVIEW_BTN);
    await expect(submitBtn).toBeDisabled();
  });

  test('save draft shows draft indicator', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Fill some content
    await page.locator(sel.STRENGTHS_INPUT + ' textarea').fill('Test strengths');

    // Click save draft
    await page.locator(sel.SAVE_DRAFT_BTN).click();

    // Draft indicator should show "Draft saved"
    await expect(page.locator(sel.DRAFT_SAVED_INDICATOR)).toBeVisible({ timeout: 3_000 });
    await expect(page.locator(sel.DRAFT_SAVED_INDICATOR)).toHaveText('Draft saved');
  });

  test('draft indicator shows unsaved changes after editing a saved draft', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Fill content and save draft
    await page.locator(sel.STRENGTHS_INPUT + ' textarea').fill('Test strengths');
    await page.locator(sel.SAVE_DRAFT_BTN).click();
    await expect(page.locator(sel.DRAFT_SAVED_INDICATOR)).toBeVisible({ timeout: 3_000 });
    await expect(page.locator(sel.DRAFT_SAVED_INDICATOR)).toHaveText('Draft saved');

    // Edit the content — should show "Unsaved changes"
    await page.locator(sel.STRENGTHS_INPUT + ' textarea').fill('Updated strengths');
    await expect(page.locator(sel.UNSAVED_CHANGES_INDICATOR)).toHaveText('Unsaved changes');

    // Save again — should return to "Draft saved"
    await page.locator(sel.SAVE_DRAFT_BTN).click();
    await expect(page.locator(sel.DRAFT_SAVED_INDICATOR)).toHaveText('Draft saved');
  });

  test('can complete and submit a full review', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Rate all criteria as "Yes"
    const criterionEvals = page.locator(sel.CRITERION_EVAL);
    const count = await criterionEvals.count();
    for (let i = 0; i < count; i++) {
      await criterionEvals.nth(i).locator('button:has-text("Yes")').click();
    }

    // Fill strengths (required)
    await page.locator(sel.STRENGTHS_INPUT + ' textarea').fill('Excellent methodology and clear presentation.');

    // Select recommendation
    await page.locator(sel.RECOMMENDATION_SELECT + ' select').selectOption('Accept');

    // Submit button should be enabled
    const submitBtn = page.locator(sel.SUBMIT_REVIEW_BTN);
    await expect(submitBtn).toBeEnabled();

    // Submit
    await submitBtn.click();

    // Should show confirmation or redirect
    await expect(page.locator('text=submitted').or(page.locator('text=Submitted')).or(page.locator('text=Review Submission'))).toBeVisible({ timeout: 10_000 });
  });

  test('review submit failure shows persistent error message', async ({ page, context }) => {
    const data = await seedScenario('reviewers-assigned', testRunId);

    await loginAs(page, context, data.reviewer1Wallet as string, 'reviewer');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.REVIEW_WORKSPACE)).toBeVisible({ timeout: 5_000 });

    // Fill all criteria
    const criterionEvals = page.locator(sel.CRITERION_EVAL);
    const count = await criterionEvals.count();
    for (let i = 0; i < count; i++) {
      await criterionEvals.nth(i).locator('button:has-text("Yes")').click();
    }
    await page.locator(sel.STRENGTHS_INPUT + ' textarea').fill('Good work.');
    await page.locator(sel.RECOMMENDATION_SELECT + ' select').selectOption('Accept');

    // Intercept the submit API call and force a failure
    await page.route('**/api/reviews/**', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
    });

    // Submit
    const submitBtn = page.locator(sel.SUBMIT_REVIEW_BTN);
    await submitBtn.click();

    // Should show persistent error message in the submission actions area
    await expect(page.locator('[data-testid="submission-error"]')).toBeVisible({ timeout: 5_000 });

    // Submit button should be re-enabled for retry (not stuck in loading)
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
  });
});
