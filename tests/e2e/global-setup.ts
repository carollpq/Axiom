/**
 * Playwright global setup — verify the dev server is running and ALLOW_TEST_AUTH is set.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

async function globalSetup() {
  // Verify dev server is reachable
  try {
    const response = await fetch(BASE_URL, { method: 'HEAD' });
    if (!response.ok && response.status !== 307 && response.status !== 302) {
      console.warn(`Dev server returned ${response.status}, tests may fail.`);
    }
  } catch {
    throw new Error(
      `Cannot reach dev server at ${BASE_URL}. Start it with: npm run dev`,
    );
  }

  // Verify test auth endpoint is available
  try {
    const response = await fetch(`${BASE_URL}/api/test/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: '0x0000000000000000000000000000000000000000' }),
    });
    if (response.status === 404) {
      throw new Error(
        'ALLOW_TEST_AUTH is not set. Start the dev server with: ALLOW_TEST_AUTH=true npm run dev',
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('ALLOW_TEST_AUTH')) {
      throw err;
    }
    // Connection errors are ok — webServer config will start the dev server
  }
}

export default globalSetup;
