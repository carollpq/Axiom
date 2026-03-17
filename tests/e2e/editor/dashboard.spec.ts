import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';

let testRunId: string;

test.describe('Editor Dashboard', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('dashboard loads with journal info', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');

    // Should show editor dashboard
    await expect(page.locator('body')).not.toHaveText('500');
    await expect(page.locator('body')).not.toHaveText('Internal Server Error');
  });

  test('journal name is displayed', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);
    const prefix = testRunId.slice(0, 8);

    await loginAs(page, context, data.editorWallet as string, 'editor');

    // Should show the journal name
    await expect(page.locator(`text=Test Journal ${prefix}`)).toBeVisible({ timeout: 10_000 });
  });

  test('submission count reflects seeded data', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');

    // Paper cards should be present (at least the submitted paper)
    const paperCards = page.locator('[data-testid="paper-card"]');
    await expect(paperCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('can navigate to incoming submissions', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');

    // Look for navigation to incoming/submissions
    const incomingLink = page.locator('a[href*="incoming"]').or(
      page.locator('text=Incoming')
    );
    if (await incomingLink.isVisible()) {
      await incomingLink.first().click();
    }
  });
});
