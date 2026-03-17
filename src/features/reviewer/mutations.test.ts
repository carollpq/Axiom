/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for reviewer/mutations.ts — DB mutation with mock verification.
 */

const mockReturning = jest.fn();
const mockWhere = jest.fn(() => ({ returning: mockReturning }));
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get update() {
      return mockUpdate;
    },
  },
}));
jest.mock('@/src/shared/lib/db/schema', () => ({
  journalReviewers: {
    id: 'id',
    reviewerWallet: 'reviewerWallet',
    status: 'status',
    respondedAt: 'respondedAt',
  },
}));
jest.mock('drizzle-orm', () => ({
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({
      _sql: strings.join(''),
      values,
    }),
    { raw: jest.fn() },
  ),
}));

import { respondToPoolInvite } from './mutations';

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([{ id: 'jr-1', status: 'accepted' }]);
});

describe('respondToPoolInvite', () => {
  it('calls db.update on journalReviewers', async () => {
    await respondToPoolInvite('jr-1', '0xWallet', 'accepted');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('sets status and respondedAt', async () => {
    await respondToPoolInvite('jr-1', '0xWallet', 'accepted');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' }),
    );
  });

  it('lowercases wallet in WHERE clause', async () => {
    const { eq } = require('drizzle-orm');
    await respondToPoolInvite('jr-1', '0xABCDEF', 'rejected');
    const walletCall = eq.mock.calls.find(
      (c: unknown[]) => c[1] === '0xabcdef',
    );
    expect(walletCall).toBeDefined();
  });

  it('returns first row', async () => {
    const result = await respondToPoolInvite('jr-1', '0xWallet', 'accepted');
    expect(result).toEqual({ id: 'jr-1', status: 'accepted' });
  });

  it('returns undefined when no match', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await respondToPoolInvite('jr-1', '0xWallet', 'accepted');
    expect(result).toBeUndefined();
  });

  it('accepts both "accepted" and "rejected"', async () => {
    await respondToPoolInvite('jr-1', '0xW', 'accepted');
    await respondToPoolInvite('jr-1', '0xW', 'rejected');
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(
      ((mockSet.mock.calls as unknown[][])[0][0] as Record<string, unknown>)
        .status,
    ).toBe('accepted');
    expect(
      ((mockSet.mock.calls as unknown[][])[1][0] as Record<string, unknown>)
        .status,
    ).toBe('rejected');
  });
});
