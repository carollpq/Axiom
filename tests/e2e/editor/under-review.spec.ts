import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Editor — Under Review / Decision', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('reviews-completed paper shows decision panel', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    // Find and click the paper
    const paperCards = page.locator(sel.PAPER_CARD);
    await paperCards.first().click();

    // Decision panel should be visible
    await expect(page.locator(sel.DECISION_PANEL)).toBeVisible({ timeout: 5_000 });
  });

  test('decision select has Accept/Reject/Revise options', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.DECISION_PANEL)).toBeVisible({ timeout: 5_000 });

    // Check decision select options
    const decisionSelect = page.locator(sel.DECISION_PANEL + ' select');
    const options = decisionSelect.locator('option');
    const texts = await options.allTextContents();
    expect(texts).toContain('Accept');
    expect(texts).toContain('Reject');
    expect(texts).toContain('Request Revision');
  });

  test('release button disabled without decision selected', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.DECISION_PANEL)).toBeVisible({ timeout: 5_000 });

    // Release button should be disabled
    const releaseBtn = page.locator(sel.RELEASE_DECISION_BTN);
    await expect(releaseBtn).toBeDisabled();
  });

  test('release button enables after selecting decision', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.DECISION_PANEL)).toBeVisible({ timeout: 5_000 });

    // Select a decision
    const decisionSelect = page.locator(sel.DECISION_PANEL + ' select');
    await decisionSelect.selectOption('accept');

    // Release button should be enabled
    const releaseBtn = page.locator(sel.RELEASE_DECISION_BTN);
    await expect(releaseBtn).toBeEnabled();
  });

  test('can add comment with decision', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.DECISION_PANEL)).toBeVisible({ timeout: 5_000 });

    // Fill comment
    const commentField = page.locator(sel.DECISION_COMMENT + ' textarea').or(
      page.locator('[data-testid="decision-comment"]')
    );
    if (await commentField.count() > 0) {
      await commentField.first().fill('Good paper, accept with minor revisions.');
    }

    // Select decision and release
    const decisionSelect = page.locator(sel.DECISION_PANEL + ' select');
    await decisionSelect.selectOption('accept');

    const releaseBtn = page.locator(sel.RELEASE_DECISION_BTN);
    await releaseBtn.click();

    // Should show loading state
    await expect(releaseBtn).toHaveText(/Releasing/);
  });

  test('star ratings and inputs are disabled during decision release', async ({ page, context }) => {
    const data = await seedScenario('reviews-completed', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.DECISION_PANEL)).toBeVisible({ timeout: 5_000 });

    // Select decision
    const decisionSelect = page.locator(sel.DECISION_PANEL + ' select');
    await decisionSelect.selectOption('accept');

    // Click release
    const releaseBtn = page.locator(sel.RELEASE_DECISION_BTN);
    await releaseBtn.click();

    // Button should show loading state
    await expect(releaseBtn).toHaveText(/Releasing/);

    // During submit, all interactive elements in the decision panel should be disabled
    // Star rating buttons (★ characters)
    const starButtons = page.locator(sel.DECISION_PANEL + ' button:has-text("★")');
    const starCount = await starButtons.count();
    for (let i = 0; i < starCount; i++) {
      await expect(starButtons.nth(i)).toBeDisabled();
    }

    // Decision select should be disabled
    await expect(decisionSelect).toBeDisabled();

    // Release button should be disabled
    await expect(releaseBtn).toBeDisabled();
  });
});
