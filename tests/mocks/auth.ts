/**
 * Auth mock — exported jest.fn() references for per-test configuration.
 *
 * This mocks the re-exported `auth` object and session helpers from
 * `@/src/shared/lib/auth/auth`. For mocking the underlying `thirdweb/auth`
 * library directly (e.g. in auth.test.ts), use `mockThirdwebAuth` from
 * `./thirdweb-auth.ts` instead.
 *
 * Usage in test files:
 *   import { mockGetSession, mockRequireSession, AUTH_COOKIE_NAME } from '../mocks/auth';
 *   jest.mock('@/src/shared/lib/auth/auth', () => ({
 *     getSession: mockGetSession,
 *     requireSession: mockRequireSession,
 *     AUTH_COOKIE: AUTH_COOKIE_NAME,
 *   }));
 */

import { TEST_WALLET } from '../helpers/fixtures';

export { TEST_WALLET };

export const AUTH_COOKIE_NAME = 'tw_auth_token';

export const mockGetSession = jest.fn();
export const mockRequireSession = jest.fn();

/** Reset all auth mocks to default (authenticated) state. */
export function resetAuthMocks(wallet: string = TEST_WALLET) {
  mockGetSession.mockResolvedValue(wallet);
  mockRequireSession.mockResolvedValue(wallet);
}

/** Configure auth mocks for unauthenticated state. */
export function resetAuthMocksUnauthenticated() {
  mockGetSession.mockResolvedValue(null);
  mockRequireSession.mockRejectedValue(new Error('Unauthorized'));
}
