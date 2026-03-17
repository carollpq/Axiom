/**
 * Tests for papers/queries.ts — Drizzle relational + chainable queries.
 */

// --- Drizzle chain mocks ---
const mockSelectWhere = jest.fn();
const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }));
const mockSelect = jest.fn(() => ({ from: mockSelectFrom }));
const mockInnerJoinLimit = jest.fn();
const mockInnerJoin = jest.fn(() => ({
  where: jest.fn(() => ({ limit: mockInnerJoinLimit })),
}));

const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get select() {
      return mockSelect;
    },
    query: {
      papers: {
        get findFirst() {
          return mockFindFirst;
        },
        get findMany() {
          return mockFindMany;
        },
      },
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  papers: { id: 'id', ownerId: 'ownerId', updatedAt: 'updatedAt' },
  authorshipContracts: { id: 'ac_id', paperId: 'paperId' },
  contractContributors: {
    id: 'cc_id',
    contractId: 'contractId',
    contributorWallet: 'contributorWallet',
  },
  submissions: {
    id: 'sub_id',
    paperId: 'sub_paperId',
    journalId: 'sub_journalId',
  },
  journals: { id: 'j_id', editorWallet: 'editorWallet' },
  reviewAssignments: {
    id: 'ra_id',
    submissionId: 'ra_submissionId',
    reviewerWallet: 'reviewerWallet',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
  inArray: jest.fn((a: unknown, b: unknown) => ({ _inArray: [a, b] })),
}));

const mockGetUserByWallet = jest.fn();
jest.mock('@/src/features/users/queries', () => ({
  get getUserByWallet() {
    return mockGetUserByWallet;
  },
}));

jest.mock('react', () => ({
  cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import {
  listUserPapers,
  requirePaperOwner,
  canAccessPaperContent,
  getPaperById,
} from './queries';

beforeEach(() => {
  jest.clearAllMocks();
  mockFindFirst.mockResolvedValue(null);
  mockFindMany.mockResolvedValue([]);
  mockGetUserByWallet.mockResolvedValue(null);

  // Default select chain: contributor rows return empty
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockReturnValue({
    where: mockSelectWhere,
    innerJoin: mockInnerJoin,
  });
  mockSelectWhere.mockResolvedValue([]);
  mockInnerJoin.mockReturnValue({
    where: jest.fn().mockReturnValue({
      limit: mockInnerJoinLimit,
    }),
  });
  mockInnerJoinLimit.mockResolvedValue([]);
});

// ===========================================================================
// listUserPapers
// ===========================================================================

describe('listUserPapers', () => {
  it('lowercases wallet for lookups', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    // Contributor rows query
    mockSelectFrom.mockReturnValue({
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });
    await listUserPapers('0xABCDEF');
    expect(mockGetUserByWallet).toHaveBeenCalledWith('0xabcdef');
  });

  it('returns empty array when no papers found', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    mockSelectFrom.mockReturnValue({
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });
    const result = await listUserPapers('0xabc');
    expect(result).toEqual([]);
  });

  it('returns papers when user owns them', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });

    // First select: contributor rows (empty)
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // contributorRows query (parallel with getUserByWallet)
        return {
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        };
      }
      // ownedIds query
      return {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 'paper-1' }]),
        }),
      };
    });

    const papersList = [{ id: 'paper-1', versions: [], contracts: [] }];
    mockFindMany.mockResolvedValue(papersList);

    const result = await listUserPapers('0xabc');
    expect(result).toEqual(papersList);
  });
});

// ===========================================================================
// requirePaperOwner
// ===========================================================================

describe('requirePaperOwner', () => {
  it('throws when paper not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    await expect(requirePaperOwner('missing', '0xabc')).rejects.toThrow(
      'Paper not found',
    );
  });

  it('throws Forbidden when wallet does not match owner', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'paper-1',
      owner: { walletAddress: '0xother' },
    });
    await expect(requirePaperOwner('paper-1', '0xabc')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('returns paper when wallet matches (case-insensitive)', async () => {
    const paper = { id: 'paper-1', owner: { walletAddress: '0xABC' } };
    mockFindFirst.mockResolvedValue(paper);
    const result = await requirePaperOwner('paper-1', '0xabc');
    expect(result).toEqual(paper);
  });

  it('throws Forbidden when owner is null', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'paper-1',
      owner: null,
    });
    await expect(requirePaperOwner('paper-1', '0xabc')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('throws Forbidden when walletAddress is undefined', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'paper-1',
      owner: { walletAddress: undefined },
    });
    await expect(requirePaperOwner('paper-1', '0xabc')).rejects.toThrow(
      'Forbidden',
    );
  });
});

// ===========================================================================
// canAccessPaperContent
// ===========================================================================

describe('canAccessPaperContent', () => {
  it('returns true when wallet is editor', async () => {
    // Set up select chains for parallel queries
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return {
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest
                .fn()
                .mockResolvedValue(callCount === 1 ? [{ id: 'sub-1' }] : []),
            }),
          }),
        }),
      };
    });

    const result = await canAccessPaperContent('paper-1', '0xeditor');
    expect(result).toBe(true);
  });

  it('returns true when wallet is reviewer', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return {
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest
                .fn()
                .mockResolvedValue(callCount === 1 ? [] : [{ id: 'ra-1' }]),
            }),
          }),
        }),
      };
    });

    const result = await canAccessPaperContent('paper-1', '0xreviewer');
    expect(result).toBe(true);
  });

  it('returns false when neither editor nor reviewer', async () => {
    mockSelect.mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }));

    const result = await canAccessPaperContent('paper-1', '0xrandom');
    expect(result).toBe(false);
  });
});

// ===========================================================================
// getPaperById
// ===========================================================================

describe('getPaperById', () => {
  it('returns null when not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await getPaperById('missing');
    expect(result).toBeNull();
  });

  it('returns paper with relations', async () => {
    const paper = {
      id: 'paper-1',
      versions: [],
      contracts: [],
      owner: { id: 'u-1' },
    };
    mockFindFirst.mockResolvedValue(paper);
    const result = await getPaperById('paper-1');
    expect(result).toEqual(paper);
  });
});
