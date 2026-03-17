/**
 * Tests for contracts/mutations.ts — DB mutations with Drizzle chainable mocks.
 */

// --- Drizzle chain mocks ---
const mockReturning = jest.fn();
const mockInsertReturning = jest.fn();
const mockWhere = jest.fn(() => ({ returning: mockReturning }));
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));
const mockInsertValues = jest.fn(() => ({ returning: mockInsertReturning }));
const mockInsert = jest.fn(() => ({ values: mockInsertValues }));
const mockDeleteReturning = jest.fn();
const mockDeleteWhere = jest.fn(() => ({ returning: mockDeleteReturning }));
const mockDelete = jest.fn(() => ({ where: mockDeleteWhere }));

// For signContributor's all-contributors check
const mockSelectWhere = jest.fn();
const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }));
const mockSelect = jest.fn(() => ({ from: mockSelectFrom }));

// Transaction mock: passes a tx object with the same chainable methods
const mockTransaction = jest.fn(
  async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      get update() {
        return mockUpdate;
      },
      get insert() {
        return mockInsert;
      },
      get delete() {
        return mockDelete;
      },
      get select() {
        return mockSelect;
      },
    };
    return fn(tx);
  },
);

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get update() {
      return mockUpdate;
    },
    get insert() {
      return mockInsert;
    },
    get delete() {
      return mockDelete;
    },
    get select() {
      return mockSelect;
    },
    get transaction() {
      return mockTransaction;
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  authorshipContracts: {
    id: 'id',
    contractHash: 'contractHash',
    status: 'status',
  },
  contractContributors: {
    id: 'id',
    contractId: 'contractId',
    contributorWallet: 'contributorWallet',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
}));

const mockGetUserByWallet = jest.fn();
jest.mock('@/src/features/users/queries', () => ({
  get getUserByWallet() {
    return mockGetUserByWallet;
  },
}));

import {
  createContract,
  addContributor,
  updateContributorFields,
  removeContributor,
  updateContractHedera,
  generateInviteToken,
  resetContractSignatures,
  updateContractSchedule,
  signContributor,
} from './mutations';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset chains
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([{ id: 'contract-1' }]);
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsertReturning.mockResolvedValue([{ id: 'contrib-1' }]);
  mockDelete.mockReturnValue({ where: mockDeleteWhere });
  mockDeleteWhere.mockReturnValue({ returning: mockDeleteReturning });
  mockDeleteReturning.mockResolvedValue([{ id: 'contrib-1' }]);
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelectWhere.mockResolvedValue([]);
});

// ===========================================================================
// createContract
// ===========================================================================

describe('createContract', () => {
  it('resolves wallet → user and inserts contract', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    const result = await createContract({
      paperTitle: 'My Paper',
      wallet: '0xABC',
    });
    expect(mockGetUserByWallet).toHaveBeenCalledWith('0xABC');
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ paperTitle: 'My Paper', creatorId: 'user-1' }),
    );
    expect(result).toEqual({ id: 'contrib-1' });
  });

  it('returns null when user not found', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    const result = await createContract({
      paperTitle: 'Test',
      wallet: '0xABC',
    });
    expect(result).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('defaults paperId to null when omitted', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    await createContract({ paperTitle: 'Test', wallet: '0x1' });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ paperId: null }),
    );
  });

  it('passes paperId when provided', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    await createContract({
      paperTitle: 'Test',
      wallet: '0x1',
      paperId: 'paper-1',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ paperId: 'paper-1' }),
    );
  });
});

// ===========================================================================
// addContributor
// ===========================================================================

describe('addContributor', () => {
  it('lowercases wallet address', async () => {
    await addContributor({
      contractId: 'c-1',
      contributorWallet: '0xABCDEF',
      contributionPct: 50,
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ contributorWallet: '0xabcdef' }),
    );
  });

  it('defaults optional fields to null', async () => {
    await addContributor({
      contractId: 'c-1',
      contributorWallet: '0xabc',
      contributionPct: 50,
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        contributorName: null,
        roleDescription: null,
        isCreator: false,
      }),
    );
  });

  it('passes provided optional fields', async () => {
    await addContributor({
      contractId: 'c-1',
      contributorWallet: '0xabc',
      contributionPct: 30,
      contributorName: 'Alice',
      roleDescription: 'Lead',
      isCreator: true,
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        contributorName: 'Alice',
        roleDescription: 'Lead',
        isCreator: true,
        contributionPct: 30,
      }),
    );
  });
});

// ===========================================================================
// updateContributorFields
// ===========================================================================

describe('updateContributorFields', () => {
  it('no-ops when empty fields', async () => {
    const result = await updateContributorFields('c-1', 'contrib-1', {});
    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('updates contributionPct only', async () => {
    await updateContributorFields('c-1', 'contrib-1', { contributionPct: 75 });
    expect(mockSet).toHaveBeenCalledWith({ contributionPct: 75 });
  });

  it('updates roleDescription only', async () => {
    await updateContributorFields('c-1', 'contrib-1', {
      roleDescription: 'Author',
    });
    expect(mockSet).toHaveBeenCalledWith({ roleDescription: 'Author' });
  });

  it('updates both fields together', async () => {
    await updateContributorFields('c-1', 'contrib-1', {
      contributionPct: 60,
      roleDescription: 'Lead',
    });
    expect(mockSet).toHaveBeenCalledWith({
      contributionPct: 60,
      roleDescription: 'Lead',
    });
  });

  it('returns null when no row matched', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await updateContributorFields('c-1', 'contrib-1', {
      contributionPct: 50,
    });
    expect(result).toBeNull();
  });
});

// ===========================================================================
// removeContributor
// ===========================================================================

describe('removeContributor', () => {
  it('deletes matching row and returns it', async () => {
    mockDeleteReturning.mockResolvedValue([{ id: 'contrib-1' }]);
    const result = await removeContributor('c-1', 'contrib-1');
    expect(mockDelete).toHaveBeenCalled();
    expect(result).toEqual({ id: 'contrib-1' });
  });

  it('returns null when no match', async () => {
    mockDeleteReturning.mockResolvedValue([]);
    const result = await removeContributor('c-1', 'missing');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// updateContractHedera
// ===========================================================================

describe('updateContractHedera', () => {
  it('sets txId, timestamp and updatedAt', async () => {
    await updateContractHedera('c-1', 'tx-123', 'ts-456');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        hederaTxId: 'tx-123',
        hederaTimestamp: 'ts-456',
      }),
    );
    expect(
      ((mockSet.mock.calls as unknown[][])[0][0] as Record<string, unknown>)
        .updatedAt,
    ).toBeDefined();
  });

  it('returns null when no row matched', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await updateContractHedera('missing', 'tx-1', 'ts-1');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// generateInviteToken
// ===========================================================================

describe('generateInviteToken', () => {
  it('creates UUID token with 7-day expiry', async () => {
    mockReturning.mockResolvedValue([{ id: 'contrib-1' }]);
    const result = await generateInviteToken('c-1', 'contrib-1');
    expect(result).not.toBeNull();
    expect(result!.token).toBeDefined();
    expect(typeof result!.token).toBe('string');
    // Token should be a UUID format
    expect(result!.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    // Expiry should be ~7 days from now
    const expiry = new Date(result!.expiresAt).getTime();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expiry - now).toBeGreaterThan(sevenDaysMs - 5000);
    expect(expiry - now).toBeLessThan(sevenDaysMs + 5000);
  });

  it('returns null when contributor not found', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await generateInviteToken('c-1', 'missing');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// resetContractSignatures
// ===========================================================================

describe('resetContractSignatures', () => {
  it('runs both updates within a transaction', async () => {
    const calls: Record<string, unknown>[] = [];
    (mockSet as jest.Mock).mockImplementation(
      (arg: Record<string, unknown>) => {
        calls.push(arg);
        return { where: mockWhere };
      },
    );
    mockWhere.mockReturnValue({ returning: mockReturning });
    mockReturning.mockResolvedValue([
      { id: 'c-1', status: 'pending_signatures' },
    ]);

    await resetContractSignatures('c-1');

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // First set: contributor reset
    expect(calls[0]).toEqual(
      expect.objectContaining({
        status: 'pending',
        signature: null,
        signedAt: null,
      }),
    );
    // Second set: contract reset
    expect(calls[1]).toEqual(
      expect.objectContaining({
        status: 'pending_signatures',
        contractHash: null,
      }),
    );
  });

  it('returns null when contract not found', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await resetContractSignatures('missing');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// updateContractSchedule
// ===========================================================================

describe('updateContractSchedule', () => {
  it('sets scheduleId and scheduleTxId', async () => {
    await updateContractSchedule('c-1', 'sched-1', 'sched-tx-1');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        hederaScheduleId: 'sched-1',
        hederaScheduleTxId: 'sched-tx-1',
      }),
    );
    expect(
      ((mockSet.mock.calls as unknown[][])[0][0] as Record<string, unknown>)
        .updatedAt,
    ).toBeDefined();
  });

  it('returns null when no row matched', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await updateContractSchedule('missing', 's1', 'tx1');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// signContributor
// ===========================================================================

describe('signContributor', () => {
  it('lowercases wallet and records signature', async () => {
    mockReturning.mockResolvedValue([{ id: 'contrib-1', status: 'signed' }]);
    // All contributors check
    mockSelectWhere.mockResolvedValue([{ status: 'signed' }]);

    await signContributor({
      contractId: 'c-1',
      contributorWallet: '0xABCDEF',
      signature: 'sig-1',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        signature: 'sig-1',
        status: 'signed',
      }),
    );
  });

  it('returns null when contributor not found', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await signContributor({
      contractId: 'c-1',
      contributorWallet: '0xabc',
      signature: 'sig-1',
    });
    expect(result).toBeNull();
  });

  /** Sets up mockSet to track all .set() calls and returns the collected args. */
  function trackSetCalls() {
    const setCalls: Record<string, unknown>[] = [];
    (mockSet as jest.Mock).mockImplementation(
      (arg: Record<string, unknown>) => {
        setCalls.push(arg);
        return { where: mockWhere };
      },
    );
    mockWhere.mockReturnValue({ returning: mockReturning });
    return setCalls;
  }

  it('auto-advances to fully_signed when all contributors signed', async () => {
    mockReturning.mockResolvedValue([{ id: 'contrib-1', status: 'signed' }]);
    mockSelectWhere.mockResolvedValue([
      { status: 'signed' },
      { status: 'signed' },
    ]);

    const setCalls = trackSetCalls();

    await signContributor({
      contractId: 'c-1',
      contributorWallet: '0xabc',
      signature: 'sig-1',
      contractHash: 'hash-abc',
    });

    // Second set call should advance to fully_signed
    expect(setCalls[1]).toEqual(
      expect.objectContaining({
        status: 'fully_signed',
        contractHash: 'hash-abc',
      }),
    );
  });

  it('stays pending_signatures when not all signed', async () => {
    mockReturning.mockResolvedValue([{ id: 'contrib-1', status: 'signed' }]);
    mockSelectWhere.mockResolvedValue([
      { status: 'signed' },
      { status: 'pending' },
    ]);

    const setCalls = trackSetCalls();

    await signContributor({
      contractId: 'c-1',
      contributorWallet: '0xabc',
      signature: 'sig-1',
      contractHash: 'hash-abc',
    });

    expect(setCalls[1]).toEqual(
      expect.objectContaining({
        status: 'pending_signatures',
      }),
    );
  });

  it('sets contractHash only when all signed', async () => {
    mockReturning.mockResolvedValue([{ id: 'contrib-1', status: 'signed' }]);
    mockSelectWhere.mockResolvedValue([
      { status: 'signed' },
      { status: 'pending' },
    ]);

    const setCalls = trackSetCalls();

    await signContributor({
      contractId: 'c-1',
      contributorWallet: '0xabc',
      signature: 'sig-1',
      contractHash: 'hash-abc',
    });

    // contractHash should be undefined (not set) when not all signed
    expect(setCalls[1].contractHash).toBeUndefined();
  });

  it('defaults contractHash to null when all signed but no hash provided', async () => {
    mockReturning.mockResolvedValue([{ id: 'contrib-1', status: 'signed' }]);
    mockSelectWhere.mockResolvedValue([{ status: 'signed' }]);

    const setCalls = trackSetCalls();

    await signContributor({
      contractId: 'c-1',
      contributorWallet: '0xabc',
      signature: 'sig-1',
    });

    expect(setCalls[1].contractHash).toBeNull();
  });

  it('returns the updated contributor row', async () => {
    const updatedRow = { id: 'contrib-1', status: 'signed', signedAt: 'now' };
    mockReturning.mockResolvedValue([updatedRow]);
    mockSelectWhere.mockResolvedValue([{ status: 'signed' }]);

    const result = await signContributor({
      contractId: 'c-1',
      contributorWallet: '0xabc',
      signature: 'sig-1',
    });
    expect(result).toEqual(updatedRow);
  });
});
