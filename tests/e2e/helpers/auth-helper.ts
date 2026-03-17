/**
 * E2E auth helper — injects a valid auth cookie into the browser context.
 */
import type { BrowserContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
// Duplicated from tests/helpers/fixtures.ts because E2E runs in Playwright (not Jest).
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

/**
 * Calls the test-only JWT endpoint and sets the auth cookie in the browser context.
 * Returns the wallet address used.
 */
export async function injectAuthCookie(
  context: BrowserContext,
  walletAddress: string = TEST_WALLET,
): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/test/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get test JWT: ${response.status} ${await response.text()}`,
    );
  }

  const { jwt, cookieName } = await response.json();

  await context.addCookies([
    {
      name: cookieName,
      value: jwt,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
    },
  ]);

  return walletAddress;
}
