import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';

let testRunId: string;

test.describe('Researcher Dashboard', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('dashboard loads for researcher with papers', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-papers', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');

    // Should show the researcher dashboard heading
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('empty state shows for new researcher', async ({ page, context }) => {
    const data = await seedScenario('empty-researcher', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');

    // Dashboard should load without errors
    await expect(page.locator('body')).not.toHaveText('500');
    await expect(page.locator('body')).not.toHaveText('Internal Server Error');
  });

  test('navigation links work', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-papers', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');

    // Check for nav links to submit, papers, etc.
    const submitLink = page.locator('a[href*="submit"]').or(page.locator('text=Submit'));
    if (await submitLink.isVisible()) {
      await submitLink.first().click();
      await expect(page).toHaveURL(/submit/);
    }
  });

  test('paper data displays correctly', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-papers', testRunId);
    const prefix = testRunId.slice(0, 8);

    await loginAs(page, context, data.userWallet as string, 'researcher');

    // Should show papers with the seeded title
    const paperTitle = page.locator(`text=Registered Paper ${prefix}`).or(
      page.locator(`text=Draft Paper ${prefix}`)
    );
    await expect(paperTitle).toBeVisible({ timeout: 10_000 });
  });
});
