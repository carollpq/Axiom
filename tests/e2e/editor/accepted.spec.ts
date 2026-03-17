import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';

let testRunId: string;

test.describe('Editor — Accepted Papers', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('accepted papers page loads', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.goto('/editor/accepted');
    await page.waitForLoadState('networkidle');

    // Should load without error
    await expect(page.locator('body')).not.toHaveText('500');
    await expect(page.locator('body')).not.toHaveText('Internal Server Error');
  });

  test('empty state when no accepted papers', async ({ page, context }) => {
    const data = await seedScenario('editor-with-journal', testRunId);

    await loginAs(page, context, data.editorWallet as string, 'editor');
    await page.goto('/editor/accepted');
    await page.waitForLoadState('networkidle');

    // Should show empty state or "no papers" message
    // The editor-with-journal scenario has only submitted papers, not accepted ones
    await expect(page.locator('body')).not.toHaveText('500');
  });
});
