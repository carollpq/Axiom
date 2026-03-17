/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for reviewer/queries.ts — verifies query shapes and wallet normalization.
 */

// Mock react.cache as passthrough
jest.mock('react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  cache: (fn: Function) => fn,
}));

const mockFindMany = jest.fn().mockResolvedValue([]);
const mockFindFirst = jest.fn().mockResolvedValue(undefined);
const mockWhere = jest.fn().mockResolvedValue([]);
const mockFrom = jest.fn(() => ({ where: mockWhere }));
const mockSelect = jest.fn(() => ({ from: mockFrom }));

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get query() {
      return {
        reviewAssignments: {
          findMany: (...args: unknown[]) => mockFindMany(...args),
        },
        reputationScores: {
          findFirst: (...args: unknown[]) => mockFindFirst(...args),
        },
        journalReviewers: {
          findMany: (...args: unknown[]) => mockFindMany(...args),
        },
      };
    },
    get select() {
      return mockSelect;
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  reviewAssignments: {
    reviewerWallet: 'reviewerWallet',
    status: 'status',
    deadline: 'deadline',
    submittedAt: 'submittedAt',
  },
  reputationScores: { userWallet: 'userWallet' },
  reputationEvents: {
    userWallet: 'userWallet',
    scoreDelta: 'scoreDelta',
    createdAt: 'createdAt',
  },
  users: { walletAddress: 'walletAddress', displayName: 'displayName' },
  journalReviewers: {
    reviewerWallet: 'reviewerWallet',
    status: 'status',
    addedAt: 'addedAt',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
  or: jest.fn((...args: unknown[]) => ({ _or: args })),
  inArray: jest.fn((col: unknown, vals: unknown[]) => ({ _in: [col, vals] })),
  gte: jest.fn((a: unknown, b: unknown) => ({ _gte: [a, b] })),
  sum: jest.fn((col: unknown) => ({ _sum: col })),
}));

jest.mock('@/src/features/users/lib', () => ({
  displayNameOrWallet: jest.fn(
    (name: string | null, wallet: string) => name ?? wallet.slice(0, 10),
  ),
}));

import {
  listAssignedReviews,
  listPendingInvites,
  listCompletedReviews,
  getReviewerReputation,
  getRecentReputationDelta,
  buildEditorNameMap,
  listPendingPoolInvites,
} from './queries';

beforeEach(() => {
  jest.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockFindFirst.mockResolvedValue(undefined);
  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([]);
});

// ===================================================================
// listAssignedReviews
// ===================================================================

describe('listAssignedReviews', () => {
  it('lowercases wallet', async () => {
    await listAssignedReviews('0xABCDEF');
    const { eq } = require('drizzle-orm');
    expect(eq).toHaveBeenCalledWith('reviewerWallet', '0xabcdef');
  });

  it('calls findMany with relations', async () => {
    await listAssignedReviews('0xwallet');
    expect(mockFindMany).toHaveBeenCalled();
    const opts = mockFindMany.mock.calls[0][0];
    expect(opts.with).toBeDefined();
    expect(opts.with.submission).toBeDefined();
  });

  it('includes orderBy', async () => {
    await listAssignedReviews('0xwallet');
    const opts = mockFindMany.mock.calls[0][0];
    expect(opts.orderBy).toBeDefined();
  });
});

// ===================================================================
// listPendingInvites
// ===================================================================

describe('listPendingInvites', () => {
  it('filters status=assigned only', async () => {
    await listPendingInvites('0xwallet');
    const { eq } = require('drizzle-orm');
    expect(eq).toHaveBeenCalledWith('status', 'assigned');
  });
});

// ===================================================================
// listCompletedReviews
// ===================================================================

describe('listCompletedReviews', () => {
  it('filters status=submitted', async () => {
    await listCompletedReviews('0xwallet');
    const { eq } = require('drizzle-orm');
    expect(eq).toHaveBeenCalledWith('status', 'submitted');
  });
});

// ===================================================================
// getReviewerReputation
// ===================================================================

describe('getReviewerReputation', () => {
  it('lowercases wallet', async () => {
    await getReviewerReputation('0xMIXEDcase');
    const { eq } = require('drizzle-orm');
    expect(eq).toHaveBeenCalledWith('userWallet', '0xmixedcase');
  });

  it('returns undefined when no row', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await getReviewerReputation('0xwallet');
    expect(result).toBeUndefined();
  });
});

// ===================================================================
// buildEditorNameMap
// ===================================================================

describe('buildEditorNameMap', () => {
  it('returns {} for empty array', async () => {
    const result = await buildEditorNameMap([]);
    expect(result).toEqual({});
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('batch queries with inArray', async () => {
    mockWhere.mockResolvedValue([
      { walletAddress: '0xabc', displayName: 'Alice' },
    ]);
    const result = await buildEditorNameMap(['0xABC']);
    const { inArray } = require('drizzle-orm');
    expect(inArray).toHaveBeenCalled();
    expect(result['0xabc']).toBe('Alice');
  });

  it('maps wallet → displayName, truncates when no displayName', async () => {
    mockWhere.mockResolvedValue([
      { walletAddress: '0xlong1234567890wallet', displayName: null },
    ]);
    const result = await buildEditorNameMap(['0xlong1234567890wallet']);
    expect(result['0xlong1234567890wallet']).toBe('0xlong1234');
  });
});

// ===================================================================
// listPendingPoolInvites
// ===================================================================

describe('listPendingPoolInvites', () => {
  it('filters status=pending', async () => {
    await listPendingPoolInvites('0xwallet');
    const { eq } = require('drizzle-orm');
    expect(eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('includes journal relation', async () => {
    await listPendingPoolInvites('0xwallet');
    const opts = mockFindMany.mock.calls[0][0];
    expect(opts.with?.journal).toBe(true);
  });
});

// ===================================================================
// getRecentReputationDelta
// ===================================================================

describe('getRecentReputationDelta', () => {
  it('lowercases wallet', async () => {
    mockWhere.mockResolvedValue([{ total: '0' }]);
    await getRecentReputationDelta('0xABCDEF');
    const { eq } = require('drizzle-orm');
    expect(eq).toHaveBeenCalledWith('userWallet', '0xabcdef');
  });

  it('returns numeric total from sum', async () => {
    mockWhere.mockResolvedValue([{ total: '7' }]);
    const result = await getRecentReputationDelta('0xwallet');
    expect(result).toBe(7);
  });

  it('returns 0 when sum is null (no events)', async () => {
    mockWhere.mockResolvedValue([{ total: null }]);
    const result = await getRecentReputationDelta('0xwallet');
    expect(result).toBe(0);
  });

  it('uses gte for date filtering', async () => {
    mockWhere.mockResolvedValue([{ total: '3' }]);
    await getRecentReputationDelta('0xwallet', 7);
    const { gte } = require('drizzle-orm');
    expect(gte).toHaveBeenCalled();
  });
});
