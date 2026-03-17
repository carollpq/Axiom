import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Editor — Incoming Submissions', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('incoming paper list loads with submitted paper', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    // Should show paper cards
    const paperCards = page.locator(sel.PAPER_CARD);
    await expect(paperCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('criteria builder shows for submitted paper', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    // Click on the paper
    const paperCards = page.locator(sel.PAPER_CARD);
    await paperCards.first().click();

    // Criteria builder should appear in the sidebar
    await expect(page.locator(sel.CRITERIA_BUILDER)).toBeVisible({ timeout: 5_000 });
  });

  test('can add and remove criteria', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.CRITERIA_BUILDER)).toBeVisible({ timeout: 5_000 });

    // Should start with 1 criterion
    let rows = page.locator(sel.CRITERION_ROW);
    expect(await rows.count()).toBe(1);

    // Add a criterion
    await page.locator(sel.ADD_CRITERION_BTN).click();
    rows = page.locator(sel.CRITERION_ROW);
    expect(await rows.count()).toBe(2);
  });

  test('publish button disabled when criteria labels are empty', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.CRITERIA_BUILDER)).toBeVisible({ timeout: 5_000 });

    // Publish button should be disabled (empty criterion label)
    const publishBtn = page.locator(sel.PUBLISH_CRITERIA_BTN);
    await expect(publishBtn).toBeDisabled();
  });

  test('publish button enables after filling criterion label', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.CRITERIA_BUILDER)).toBeVisible({ timeout: 5_000 });

    // Fill in criterion label
    const criterionInput = page.locator(sel.CRITERION_ROW).first().locator('input[type="text"]');
    await criterionInput.fill('Is the methodology sound?');

    // Publish button should be enabled
    const publishBtn = page.locator(sel.PUBLISH_CRITERIA_BTN);
    await expect(publishBtn).toBeEnabled();
  });

  test('criteria publish shows success message', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.CRITERIA_BUILDER)).toBeVisible({ timeout: 5_000 });

    // Fill criterion label
    const criterionInput = page.locator(sel.CRITERION_ROW).first().locator('input[type="text"]');
    await criterionInput.fill('Is the methodology sound?');

    // Publish
    await page.locator(sel.PUBLISH_CRITERIA_BTN).click();

    // Should show success (immutable) message
    await expect(page.locator('text=Criteria published')).toBeVisible({ timeout: 10_000 });
  });

  test('already-published criteria shows immutable banner and hides builder', async ({ page, context }) => {
    const data = await seedScenario('criteria-published', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();

    // Should show the immutable banner
    await expect(page.locator('text=Criteria published on-chain')).toBeVisible({ timeout: 5_000 });

    // Builder form elements should NOT be visible (prevents duplicate publish)
    await expect(page.locator(sel.ADD_CRITERION_BTN)).not.toBeVisible();
    await expect(page.locator(sel.PUBLISH_CRITERIA_BTN)).not.toBeVisible();
    await expect(page.locator(sel.CRITERION_ROW)).not.toBeVisible();
  });

  test('inputs are disabled during criteria publish', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.waitForLoadState('networkidle');

    await page.locator(sel.PAPER_CARD).first().click();
    await expect(page.locator(sel.CRITERIA_BUILDER)).toBeVisible({ timeout: 5_000 });

    // Fill criterion
    const criterionInput = page.locator(sel.CRITERION_ROW).first().locator('input[type="text"]');
    await criterionInput.fill('Test criterion');

    // Click publish
    await page.locator(sel.PUBLISH_CRITERIA_BTN).click();

    // Publish button should show loading state and be disabled
    const publishBtn = page.locator(sel.PUBLISH_CRITERIA_BTN);
    await expect(publishBtn).toHaveText(/Publishing/);
    await expect(publishBtn).toBeDisabled();

    // Criterion input should be disabled during publish
    await expect(criterionInput).toBeDisabled();

    // Add criterion button should be disabled during publish
    await expect(page.locator(sel.ADD_CRITERION_BTN)).toBeDisabled();
  });
});
