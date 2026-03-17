/**
 * Auth mock — provides a consistent test wallet.
 */

export const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

export function mockAuth(wallet: string = TEST_WALLET) {
  jest.mock('@/src/shared/lib/auth/auth', () => ({
    getSession: jest.fn().mockResolvedValue(wallet),
    requireSession: jest.fn().mockResolvedValue(wallet),
    AUTH_COOKIE: 'tw_auth_token',
  }));
}

export function mockUnauthenticated() {
  jest.mock('@/src/shared/lib/auth/auth', () => ({
    getSession: jest.fn().mockResolvedValue(null),
    requireSession: jest.fn().mockRejectedValue(new Error('Unauthorized')),
    AUTH_COOKIE: 'tw_auth_token',
  }));
}
