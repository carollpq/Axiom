/**
 * Reusable Thirdweb auth mock with configurable jest.fn() references.
 *
 * This mocks the raw `thirdweb/auth` library (`createAuth` return value).
 * For mocking the re-exported session helpers from `@/src/shared/lib/auth/auth`,
 * use `mockGetSession`/`mockRequireSession` from `./auth.ts` instead.
 *
 * Usage:
 *   import { mockThirdwebAuth } from '../mocks/thirdweb-auth';
 *   jest.mock('thirdweb/auth', () => ({
 *     createAuth: () => mockThirdwebAuth,
 *   }));
 */

export const mockThirdwebAuth = {
  generatePayload: jest.fn(),
  verifyPayload: jest.fn(),
  verifyJWT: jest.fn(),
  generateJWT: jest.fn(),
};

/** Clears all call history and implementations (does NOT set default return values). */
export function clearThirdwebAuthMocks() {
  mockThirdwebAuth.generatePayload.mockReset();
  mockThirdwebAuth.verifyPayload.mockReset();
  mockThirdwebAuth.verifyJWT.mockReset();
  mockThirdwebAuth.generateJWT.mockReset();
}
