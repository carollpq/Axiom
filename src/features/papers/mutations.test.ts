/**
 * Tests for papers/mutations.ts — DB mutations with Drizzle chainable mocks.
 */

// --- Drizzle chain mocks ---

const mockReturning = jest.fn();
const mockInsertReturning = jest.fn();
const mockWhere = jest.fn(() => ({ returning: mockReturning }));
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));
const mockInsertValues = jest.fn(() => ({ returning: mockInsertReturning }));
const mockInsert = jest.fn(() => ({ values: mockInsertValues }));

// For select chains in createPaperVersion
const mockSelectLimit = jest.fn();
const mockSelectWhere = jest.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }));
const mockSelect = jest.fn(() => ({ from: mockSelectFrom }));

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get update() {
      return mockUpdate;
    },
    get insert() {
      return mockInsert;
    },
    get select() {
      return mockSelect;
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  papers: { id: 'id', currentVersion: 'currentVersion' },
  paperVersions: { id: 'id', paperId: 'paperId' },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
}));

const mockGetUserByWallet = jest.fn();
jest.mock('@/src/features/users/queries', () => ({
  get getUserByWallet() {
    return mockGetUserByWallet;
  },
}));

import {
  createPaper,
  updatePaper,
  createPaperVersion,
  updatePaperVersionHedera,
} from './mutations';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset chains
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([{ id: 'paper-1' }]);
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsertReturning.mockResolvedValue([{ id: 'paper-1', title: 'Test' }]);
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
});

// ===========================================================================
// createPaper
// ===========================================================================

describe('createPaper', () => {
  it('resolves wallet → user and inserts paper', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    const result = await createPaper({
      title: 'Test',
      abstract: 'Abstract',
      wallet: '0xabc',
    });
    expect(mockGetUserByWallet).toHaveBeenCalledWith('0xabc');
    expect(mockInsert).toHaveBeenCalled();
    expect(result).toEqual({ id: 'paper-1', title: 'Test' });
  });

  it('returns null when user not found', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    const result = await createPaper({
      title: 'Test',
      abstract: 'Abstract',
      wallet: '0xabc',
    });
    expect(result).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('passes studyType defaulting to original', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    await createPaper({ title: 'T', abstract: 'A', wallet: '0x1' });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ studyType: 'original' }),
    );
  });

  it('passes provided studyType', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    await createPaper({
      title: 'T',
      abstract: 'A',
      wallet: '0x1',
      studyType: 'meta_analysis',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ studyType: 'meta_analysis' }),
    );
  });

  it('sets ownerId from resolved user', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'user-42' });
    await createPaper({ title: 'T', abstract: 'A', wallet: '0x1' });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'user-42' }),
    );
  });

  it('passes Lit metadata', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'u1' });
    await createPaper({
      title: 'T',
      abstract: 'A',
      wallet: '0x1',
      litDataToEncryptHash: 'hash1',
      litAccessConditionsJson: '{}',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        litDataToEncryptHash: 'hash1',
        litAccessConditionsJson: '{}',
      }),
    );
  });
});

// ===========================================================================
// updatePaper
// ===========================================================================

describe('updatePaper', () => {
  it('no-ops and returns null when no fields provided', async () => {
    const result = await updatePaper('paper-1', {});
    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('updates title and bumps updatedAt', async () => {
    await updatePaper('paper-1', { title: 'New Title' });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Title' }),
    );
    expect(mockSet.mock.calls[0][0].updatedAt).toBeDefined();
  });

  it('updates abstract', async () => {
    await updatePaper('paper-1', { abstract: 'New abstract' });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ abstract: 'New abstract' }),
    );
  });

  it('updates status', async () => {
    await updatePaper('paper-1', { status: 'submitted' as const });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'submitted' }),
    );
  });

  it('returns null when no row matched', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await updatePaper('paper-1', { title: 'X' });
    expect(result).toBeNull();
  });

  it('updates litAccessConditionsJson', async () => {
    await updatePaper('paper-1', { litAccessConditionsJson: '{"new": true}' });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ litAccessConditionsJson: '{"new": true}' }),
    );
  });
});

// ===========================================================================
// createPaperVersion
// ===========================================================================

describe('createPaperVersion', () => {
  beforeEach(() => {
    mockSelectLimit.mockResolvedValue([{ id: 'paper-1', currentVersion: 2 }]);
    mockInsertReturning.mockResolvedValue([{ id: 'v1', versionNumber: 2 }]);
    // For the update after insert
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ returning: mockReturning });
  });

  it('returns null when paper not found', async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await createPaperVersion({
      paperId: 'missing',
      paperHash: 'abc',
    });
    expect(result).toBeNull();
  });

  it('inserts version with current version number', async () => {
    await createPaperVersion({ paperId: 'paper-1', paperHash: 'abc' });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ versionNumber: 2, paperHash: 'abc' }),
    );
  });

  it('bumps paper.currentVersion', async () => {
    await createPaperVersion({ paperId: 'paper-1', paperHash: 'abc' });
    // Second update call is the version bump
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ currentVersion: 3 }),
    );
  });

  it('passes optional fields', async () => {
    await createPaperVersion({
      paperId: 'paper-1',
      paperHash: 'abc',
      datasetHash: 'ds1',
      codeRepoUrl: 'https://github.com/foo',
      envSpecHash: 'env1',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetHash: 'ds1',
        codeRepoUrl: 'https://github.com/foo',
        envSpecHash: 'env1',
      }),
    );
  });
});

// ===========================================================================
// updatePaperVersionHedera
// ===========================================================================

describe('updatePaperVersionHedera', () => {
  it('sets hederaTxId and hederaTimestamp', async () => {
    await updatePaperVersionHedera('v1', 'tx-123', 'ts-123');
    expect(mockSet).toHaveBeenCalledWith({
      hederaTxId: 'tx-123',
      hederaTimestamp: 'ts-123',
    });
  });

  it('returns updated row', async () => {
    mockReturning.mockResolvedValue([{ id: 'v1', hederaTxId: 'tx-1' }]);
    const result = await updatePaperVersionHedera('v1', 'tx-1', 'ts-1');
    expect(result).toEqual({ id: 'v1', hederaTxId: 'tx-1' });
  });

  it('returns null when no row matched', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await updatePaperVersionHedera('missing', 'tx-1', 'ts-1');
    expect(result).toBeNull();
  });
});
