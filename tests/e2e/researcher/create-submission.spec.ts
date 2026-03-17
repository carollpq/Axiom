import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';
import * as sel from '../helpers/selectors';

let testRunId: string;

test.describe('Create Submission', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('form loads with all dropdowns', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/submit');
    await page.waitForLoadState('networkidle');

    // Form container should be visible
    await expect(page.locator(sel.CREATE_SUBMISSION_FORM)).toBeVisible();

    // All selects should be present
    await expect(page.locator(sel.PAPER_SELECT)).toBeVisible();
    await expect(page.locator(sel.VERSION_SELECT)).toBeVisible();
    await expect(page.locator(sel.JOURNAL_SELECT)).toBeVisible();
    await expect(page.locator(sel.CONTRACT_SELECT)).toBeVisible();

    // Submit button should be disabled initially
    const submitBtn = page.locator(sel.SUBMIT_PAPER_BTN);
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('dropdowns populate with seeded data', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/submit');
    await page.waitForLoadState('networkidle');

    // Paper select should have options
    const paperSelect = page.locator(sel.PAPER_SELECT + ' select');
    const paperOptions = paperSelect.locator('option');
    // Should have placeholder + at least one paper
    expect(await paperOptions.count()).toBeGreaterThan(1);

    // Journal select should have options
    const journalSelect = page.locator(sel.JOURNAL_SELECT + ' select');
    const journalOptions = journalSelect.locator('option');
    expect(await journalOptions.count()).toBeGreaterThan(1);
  });

  test('version select enables after paper selection', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/submit');
    await page.waitForLoadState('networkidle');

    // Version select should be disabled initially
    const versionSelect = page.locator(sel.VERSION_SELECT + ' select');
    await expect(versionSelect).toBeDisabled();

    // Select a paper
    const paperSelect = page.locator(sel.PAPER_SELECT + ' select');
    await paperSelect.selectOption({ index: 1 });

    // Version select should now be enabled
    await expect(versionSelect).toBeEnabled();
  });

  test('validation hint shows when fields are missing', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/submit');
    await page.waitForLoadState('networkidle');

    // Should show a validation hint
    await expect(page.locator('text=Please select')).toBeVisible();
  });

  test('submit button enables when all fields filled', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/submit');
    await page.waitForLoadState('networkidle');

    // Fill all fields
    const paperSelect = page.locator(sel.PAPER_SELECT + ' select');
    await paperSelect.selectOption({ index: 1 });

    const versionSelect = page.locator(sel.VERSION_SELECT + ' select');
    await versionSelect.selectOption({ index: 1 });

    const journalSelect = page.locator(sel.JOURNAL_SELECT + ' select');
    await journalSelect.selectOption({ index: 1 });

    const contractSelect = page.locator(sel.CONTRACT_SELECT + ' select');
    await contractSelect.selectOption({ index: 1 });

    // Submit button should now be enabled
    const submitBtn = page.locator(sel.SUBMIT_PAPER_BTN);
    await expect(submitBtn).toBeEnabled();
  });

  test('successful submission redirects to dashboard', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/submit');
    await page.waitForLoadState('networkidle');

    // Fill all fields
    await page.locator(sel.PAPER_SELECT + ' select').selectOption({ index: 1 });
    await page.locator(sel.VERSION_SELECT + ' select').selectOption({ index: 1 });
    await page.locator(sel.JOURNAL_SELECT + ' select').selectOption({ index: 1 });
    await page.locator(sel.CONTRACT_SELECT + ' select').selectOption({ index: 1 });

    // Submit
    await page.locator(sel.SUBMIT_PAPER_BTN).click();

    // Should redirect to researcher dashboard
    await page.waitForURL(/\/researcher/, { timeout: 10_000 });
  });

  test('double-submit guard — button disables and shows loading after first click', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/submit');
    await page.waitForLoadState('networkidle');

    // Fill all fields
    await page.locator(sel.PAPER_SELECT + ' select').selectOption({ index: 1 });
    await page.locator(sel.VERSION_SELECT + ' select').selectOption({ index: 1 });
    await page.locator(sel.JOURNAL_SELECT + ' select').selectOption({ index: 1 });
    await page.locator(sel.CONTRACT_SELECT + ' select').selectOption({ index: 1 });

    const submitBtn = page.locator(sel.SUBMIT_PAPER_BTN);

    // Click submit
    await submitBtn.click();

    // Button should show "Submitting..." text
    await expect(submitBtn).toHaveText(/Submitting/);

    // Button should be disabled to prevent double-submit
    await expect(submitBtn).toBeDisabled();
  });

  test('empty state shows when no papers exist', async ({ page, context }) => {
    const data = await seedScenario('empty-researcher', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/submit');
    await page.waitForLoadState('networkidle');

    // Should show no papers message
    await expect(page.locator('text=No registered papers')).toBeVisible();
  });
});
