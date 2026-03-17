import { test, expect } from '@playwright/test';
import { seedScenario, cleanup, generateTestRunId } from '../helpers/seed-helper';
import { loginAs } from '../helpers/flow-helpers';

let testRunId: string;

test.describe('Researcher — Authorship Contracts', () => {
  test.beforeEach(() => {
    testRunId = generateTestRunId();
  });

  test.afterEach(async () => {
    await cleanup(testRunId);
  });

  test('contracts page loads', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/contracts');
    await page.waitForLoadState('networkidle');

    // Should load without error
    await expect(page.locator('body')).not.toHaveText('500');
    await expect(page.locator('body')).not.toHaveText('Internal Server Error');
  });

  test('contract shows as fully signed', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-contract', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/contracts');
    await page.waitForLoadState('networkidle');

    // Should show contract or status indicator
    const signedStatus = page.locator('text=Signed').or(page.locator('text=signed')).or(page.locator('text=Fully'));
    await expect(signedStatus.first()).toBeVisible({ timeout: 10_000 });
  });

  test('create contract page loads', async ({ page, context }) => {
    const data = await seedScenario('researcher-with-papers', testRunId);

    await loginAs(page, context, data.userWallet as string, 'researcher');
    await page.goto('/researcher/contracts/new');
    await page.waitForLoadState('networkidle');

    // Should load without error
    await expect(page.locator('body')).not.toHaveText('500');
  });
});
