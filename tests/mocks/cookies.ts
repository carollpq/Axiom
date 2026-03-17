/**
 * Reusable mock for `next/headers` cookies().
 *
 * Usage:
 *   import { mockCookieStore, createCookiesMock } from '../mocks/cookies';
 *   jest.mock('next/headers', () => ({ cookies: createCookiesMock() }));
 */

export const mockCookieStore = {
  get: jest.fn() as jest.Mock,
  set: jest.fn() as jest.Mock,
  delete: jest.fn() as jest.Mock,
};

/** Returns a mock `cookies` function that resolves to `mockCookieStore`. */
export function createCookiesMock() {
  return jest.fn().mockResolvedValue(mockCookieStore);
}
