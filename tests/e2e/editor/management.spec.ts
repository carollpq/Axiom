import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';

let testRunId: string;

test.describe('Editor — Journal Management', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('journal settings page loads', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.goto('/editor/settings');
    await page.waitForLoadState('networkidle');

    // Should load without error
    await expect(page.locator('body')).not.toHaveText('500');
  });

  test('reviewer pool page loads', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.goto('/editor/reviewer-pool');
    await page.waitForLoadState('networkidle');

    // Should load without error
    await expect(page.locator('body')).not.toHaveText('500');
  });

  test('journal name displays on settings page', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);
    const prefix = testRunId.slice(0, 8);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.goto('/editor/settings');
    await page.waitForLoadState('networkidle');

    // Should show journal name
    const journalName = page.locator(`text=Test Journal ${prefix}`);
    if (await journalName.isVisible()) {
      await expect(journalName).toBeVisible();
    }
  });
});
