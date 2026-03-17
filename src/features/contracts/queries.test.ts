/**
 * Tests for contracts/queries.ts — Drizzle relational queries + chainable selects.
 */

// --- Drizzle chain mocks ---
const mockSelectLimit = jest.fn();
const mockSelectWhere = jest.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }));
const mockSelect = jest.fn(() => ({ from: mockSelectFrom }));
const mockSelectDistinctFrom = jest.fn(() => ({ where: jest.fn() }));
const mockSelectDistinct = jest.fn(() => ({ from: mockSelectDistinctFrom }));

const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get select() {
      return mockSelect;
    },
    get selectDistinct() {
      return mockSelectDistinct;
    },
    query: {
      authorshipContracts: {
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
  authorshipContracts: { id: 'id', creatorId: 'creatorId' },
  contractContributors: {
    id: 'id',
    contractId: 'contractId',
    contributorWallet: 'contributorWallet',
    inviteToken: 'inviteToken',
    inviteExpiresAt: 'inviteExpiresAt',
    status: 'status',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
  gt: jest.fn((a: unknown, b: unknown) => ({ _gt: [a, b] })),
  inArray: jest.fn((a: unknown, b: unknown) => ({ _inArray: [a, b] })),
}));

const mockGetUserByWallet = jest.fn();
jest.mock('@/src/features/users/queries', () => ({
  get getUserByWallet() {
    return mockGetUserByWallet;
  },
}));

// Must import react cache mock to avoid errors
jest.mock('react', () => ({
  cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import { eq } from 'drizzle-orm';
import {
  listUserContracts,
  getContributorByInviteToken,
  listContractsToSign,
  requireContractOwner,
  getContractById,
} from './queries';

beforeEach(() => {
  jest.clearAllMocks();
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
  mockSelectLimit.mockResolvedValue([]);
  mockFindFirst.mockResolvedValue(null);
  mockFindMany.mockResolvedValue([]);
});

// ===========================================================================
// listUserContracts
// ===========================================================================

describe('listUserContracts', () => {
  it('resolves wallet → user and queries contracts', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    mockFindMany.mockResolvedValue([{ id: 'c-1', contributors: [] }]);
    const result = await listUserContracts('0xABC');
    expect(mockGetUserByWallet).toHaveBeenCalledWith('0xABC');
    expect(mockFindMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'c-1', contributors: [] }]);
  });

  it('returns empty array when user not found', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    const result = await listUserContracts('0xABC');
    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// getContributorByInviteToken
// ===========================================================================

describe('getContributorByInviteToken', () => {
  it('returns null for expired or missing token', async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await getContributorByInviteToken('expired-token');
    expect(result).toBeNull();
  });

  it('returns null when contract not found for valid contributor', async () => {
    mockSelectLimit.mockResolvedValue([{ id: 'contrib-1', contractId: 'c-1' }]);
    mockFindFirst.mockResolvedValue(null);
    const result = await getContributorByInviteToken('valid-token');
    expect(result).toBeNull();
  });

  it('returns contributor + contract for valid token', async () => {
    const contributor = { id: 'contrib-1', contractId: 'c-1' };
    const contract = { id: 'c-1', contributors: [contributor] };
    mockSelectLimit.mockResolvedValue([contributor]);
    mockFindFirst.mockResolvedValue(contract);
    const result = await getContributorByInviteToken('valid-token');
    expect(result).toEqual({ contributor, contract });
  });
});

// ===========================================================================
// listContractsToSign
// ===========================================================================

describe('listContractsToSign', () => {
  it('lowercases wallet for contributor lookup', async () => {
    mockFindMany.mockResolvedValue([]);
    await listContractsToSign('0xABCDEF');
    expect(mockFindMany).toHaveBeenCalled();
    // Verify eq was called with the lowercased wallet
    expect(eq).toHaveBeenCalledWith('contributorWallet', '0xabcdef');
  });

  it('returns contracts with pending contributors', async () => {
    const contracts = [{ id: 'c-1', contributors: [{ status: 'pending' }] }];
    mockFindMany.mockResolvedValue(contracts);
    const result = await listContractsToSign('0xabc');
    expect(result).toEqual(contracts);
  });
});

// ===========================================================================
// requireContractOwner
// ===========================================================================

describe('requireContractOwner', () => {
  it('throws when contract not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(requireContractOwner('missing', '0xabc')).rejects.toThrow(
      'Contract not found',
    );
  });

  it('throws when user not found', async () => {
    mockFindFirst.mockResolvedValue({ id: 'c-1', creatorId: 'user-1' });
    mockGetUserByWallet.mockResolvedValue(null);
    await expect(requireContractOwner('c-1', '0xabc')).rejects.toThrow(
      'Only the contract creator can perform this action',
    );
  });

  it('throws when wallet does not match creator', async () => {
    mockFindFirst.mockResolvedValue({ id: 'c-1', creatorId: 'user-1' });
    mockGetUserByWallet.mockResolvedValue({ id: 'user-2' });
    await expect(requireContractOwner('c-1', '0xabc')).rejects.toThrow(
      'Only the contract creator can perform this action',
    );
  });

  it('returns contract when wallet matches creator', async () => {
    const contract = { id: 'c-1', creatorId: 'user-1' };
    mockFindFirst.mockResolvedValue(contract);
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    const result = await requireContractOwner('c-1', '0xabc');
    expect(result).toEqual(contract);
  });
});

// ===========================================================================
// getContractById
// ===========================================================================

describe('getContractById', () => {
  it('returns null when not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await getContractById('missing');
    expect(result).toBeNull();
  });

  it('returns contract with relations', async () => {
    const contract = { id: 'c-1', contributors: [], creator: {}, paper: {} };
    mockFindFirst.mockResolvedValue(contract);
    const result = await getContractById('c-1');
    expect(result).toEqual(contract);
  });
});
