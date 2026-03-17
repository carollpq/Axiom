/**
 * Tests for rebuttals/mutations.ts — DB mutations with Drizzle chainable mocks.
 */

// --- Drizzle chain mocks ---
const mockReturning = jest.fn();
const mockInsertReturning = jest.fn();
const mockWhere = jest.fn(() => ({ returning: mockReturning }));
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));
const mockInsertValues = jest.fn(() => ({ returning: mockInsertReturning }));
const mockInsert = jest.fn(() => ({ values: mockInsertValues }));

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get update() {
      return mockUpdate;
    },
    get insert() {
      return mockInsert;
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  rebuttals: { id: 'id', status: 'status' },
  rebuttalResponses: { rebuttalId: 'rebuttalId' },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
}));

import {
  openRebuttal,
  submitRebuttalResponses,
  updateRebuttalHedera,
  resolveRebuttal,
} from './mutations';

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([{ id: 'rebuttal-1' }]);
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsertReturning.mockResolvedValue([{ id: 'rebuttal-1' }]);
});

// ===========================================================================
// openRebuttal
// ===========================================================================

describe('openRebuttal', () => {
  it('lowercases author wallet', async () => {
    await openRebuttal({
      submissionId: 'sub-1',
      authorWallet: '0xABCDEF',
      deadline: '2025-03-01T00:00:00Z',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ authorWallet: '0xabcdef' }),
    );
  });

  it('defaults hederaTxId to null when omitted', async () => {
    await openRebuttal({
      submissionId: 'sub-1',
      authorWallet: '0xabc',
      deadline: '2025-03-01T00:00:00Z',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ hederaTxId: null }),
    );
  });

  it('passes hederaTxId when provided', async () => {
    await openRebuttal({
      submissionId: 'sub-1',
      authorWallet: '0xabc',
      deadline: '2025-03-01T00:00:00Z',
      hederaTxId: 'tx-123',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ hederaTxId: 'tx-123' }),
    );
  });

  it('returns the inserted row', async () => {
    mockInsertReturning.mockResolvedValue([
      { id: 'rebuttal-1', status: 'open' },
    ]);
    const result = await openRebuttal({
      submissionId: 'sub-1',
      authorWallet: '0xabc',
      deadline: '2025-03-01T00:00:00Z',
    });
    expect(result).toEqual({ id: 'rebuttal-1', status: 'open' });
  });

  it('returns null when insert returns empty', async () => {
    mockInsertReturning.mockResolvedValue([]);
    const result = await openRebuttal({
      submissionId: 'sub-1',
      authorWallet: '0xabc',
      deadline: '2025-03-01T00:00:00Z',
    });
    expect(result).toBeNull();
  });
});

// ===========================================================================
// submitRebuttalResponses
// ===========================================================================

describe('submitRebuttalResponses', () => {
  it('inserts response rows and transitions rebuttal to submitted', async () => {
    // Insert for responses returns nothing (no .returning())
    mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
    // We need a separate mock for the plain insert (no returning)
    mockInsert.mockReturnValueOnce({
      values: jest.fn().mockResolvedValue(undefined),
    });
    // Then for the update
    mockUpdate.mockReturnValue({ set: mockSet });

    const responses = [
      {
        reviewId: 'rev-1',
        position: 'agree' as const,
        justification: 'Good point',
      },
      {
        reviewId: 'rev-2',
        criterionId: 'crit-1',
        position: 'disagree' as const,
        justification: 'Evidence shows otherwise',
        evidence: 'https://example.com',
      },
    ];

    const result = await submitRebuttalResponses(
      'rebuttal-1',
      responses,
      'hash-abc',
    );
    expect(result).toEqual({ id: 'rebuttal-1' });
  });

  it('returns null when rebuttal update returns empty (not in open status)', async () => {
    mockInsert.mockReturnValueOnce({
      values: jest.fn().mockResolvedValue(undefined),
    });
    mockReturning.mockResolvedValue([]);

    const result = await submitRebuttalResponses(
      'rebuttal-1',
      [{ reviewId: 'rev-1', position: 'agree' as const, justification: 'Ok' }],
      'hash',
    );
    expect(result).toBeNull();
  });

  it('maps optional fields to null defaults', async () => {
    const insertValuesFn = jest.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValueOnce({ values: insertValuesFn });

    await submitRebuttalResponses(
      'rebuttal-1',
      [{ reviewId: 'rev-1', position: 'agree' as const, justification: 'Ok' }],
      'hash',
    );

    expect(insertValuesFn).toHaveBeenCalledWith([
      expect.objectContaining({
        criterionId: null,
        evidence: null,
      }),
    ]);
  });
});

// ===========================================================================
// updateRebuttalHedera
// ===========================================================================

describe('updateRebuttalHedera', () => {
  it('backfills txId (void return)', async () => {
    // updateRebuttalHedera has no .returning() — just update().set().where()
    mockWhere.mockResolvedValue(undefined);
    await updateRebuttalHedera('rebuttal-1', 'tx-123');
    expect(mockSet).toHaveBeenCalledWith({ hederaTxId: 'tx-123' });
  });
});

// ===========================================================================
// resolveRebuttal
// ===========================================================================

describe('resolveRebuttal', () => {
  it('sets resolution, editorNotes, resolvedAt, and status resolved', async () => {
    await resolveRebuttal({
      rebuttalId: 'rebuttal-1',
      resolution: 'upheld',
      editorNotes: 'Reviewer was wrong',
    });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        resolution: 'upheld',
        editorNotes: 'Reviewer was wrong',
      }),
    );
    // resolvedAt should be set
    expect(mockSet.mock.calls[0][0].resolvedAt).toBeDefined();
  });

  it('returns null when no row matched (wrong id or not in submitted status)', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await resolveRebuttal({
      rebuttalId: 'missing',
      resolution: 'rejected',
      editorNotes: 'N/A',
    });
    expect(result).toBeNull();
  });

  it('returns the updated rebuttal row', async () => {
    const row = { id: 'rebuttal-1', status: 'resolved', resolution: 'partial' };
    mockReturning.mockResolvedValue([row]);
    const result = await resolveRebuttal({
      rebuttalId: 'rebuttal-1',
      resolution: 'partial',
      editorNotes: 'Partially upheld',
    });
    expect(result).toEqual(row);
  });
});
