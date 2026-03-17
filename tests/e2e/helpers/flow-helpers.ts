/**
 * Reusable multi-step flow functions for E2E tests.
 */
import type { Page, BrowserContext } from '@playwright/test';
import { injectAuthCookie } from './auth-helper';
import * as sel from './selectors';

/**
 * Login as a specific wallet and navigate to the role dashboard.
 */
export async function loginAs(
  page: Page,
  context: BrowserContext,
  wallet: string,
  role: 'researcher' | 'editor' | 'reviewer',
): Promise<void> {
  await injectAuthCookie(context, wallet);
  await page.goto(`/${role}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Fill out the create-submission form and submit.
 */
export async function fillAndSubmitPaper(
  page: Page,
  options: {
    paperTitle: string;
    versionLabel?: string;
    journalName: string;
    contractTitle: string;
  },
): Promise<void> {
  // Select paper
  const paperSelect = page.locator(sel.PAPER_SELECT + ' select');
  await paperSelect.selectOption({ label: options.paperTitle });

  // Select version (first available if not specified)
  const versionSelect = page.locator(sel.VERSION_SELECT + ' select');
  if (options.versionLabel) {
    await versionSelect.selectOption({ label: options.versionLabel });
  } else {
    // Select first non-placeholder option
    await versionSelect.selectOption({ index: 1 });
  }

  // Select journal
  const journalSelect = page.locator(sel.JOURNAL_SELECT + ' select');
  await journalSelect.selectOption({ label: options.journalName });

  // Select contract
  const contractSelect = page.locator(sel.CONTRACT_SELECT + ' select');
  // Find the option matching the contract title
  const contractOptions = await contractSelect.locator('option').allTextContents();
  const matchIdx = contractOptions.findIndex((t) => t.includes(options.contractTitle));
  if (matchIdx > 0) {
    await contractSelect.selectOption({ index: matchIdx });
  }

  // Submit
  await page.locator(sel.SUBMIT_PAPER_BTN).click();
}

/**
 * Fill out a review form with all criteria and general comments.
 */
export async function fillReviewForm(
  page: Page,
  options?: {
    ratings?: ('Yes' | 'No' | 'Partially')[];
    strengths?: string;
    weaknesses?: string;
    recommendation?: string;
  },
): Promise<void> {
  // Rate each criterion
  const criterionEvals = page.locator(sel.CRITERION_EVAL);
  const count = await criterionEvals.count();

  for (let i = 0; i < count; i++) {
    const rating = options?.ratings?.[i] ?? 'Yes';
    await criterionEvals.nth(i).locator(`button:has-text("${rating}")`).click();
  }

  // Fill general comments
  const strengths = options?.strengths ?? 'Strong methodology and clear writing.';
  await page.locator(sel.STRENGTHS_INPUT + ' textarea').fill(strengths);

  if (options?.weaknesses) {
    await page.locator(sel.WEAKNESSES_INPUT + ' textarea').fill(options.weaknesses);
  }

  // Select recommendation
  const rec = options?.recommendation ?? 'Accept';
  await page.locator(sel.RECOMMENDATION_SELECT + ' select').selectOption({ label: rec });
}

/**
 * Fill a rebuttal response for the currently selected review.
 */
export async function fillRebuttalResponse(
  page: Page,
  position: 'agree' | 'disagree',
  justification: string,
): Promise<void> {
  if (position === 'agree') {
    await page.locator(sel.AGREE_BTN).click();
  } else {
    await page.locator(sel.DISAGREE_BTN).click();
  }
  await page.locator(sel.JUSTIFICATION_INPUT + ' textarea').fill(justification);
}

/**
 * Wait for a toast notification with specific text.
 */
export async function waitForToast(
  page: Page,
  text: string,
  timeout = 5000,
): Promise<void> {
  await page.locator(`[data-sonner-toast]:has-text("${text}")`).waitFor({
    state: 'visible',
    timeout,
  });
}

/**
 * Assert no console errors during an action.
 */
export async function expectNoConsoleErrors(
  page: Page,
  action: () => Promise<void>,
): Promise<string[]> {
  const errors: string[] = [];
  const handler = (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', handler);
  await action();
  page.off('console', handler);
  return errors;
}
