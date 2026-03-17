/**
 * Tests for submissions/mutations.ts — DB mutations with Drizzle chainable mocks.
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
  submissions: { id: 'id', status: 'status' },
  reviewCriteria: { submissionId: 'submissionId' },
  reviewAssignments: { id: 'id' },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
  inArray: jest.fn((a: unknown, b: unknown) => ({ _inArray: [a, b] })),
}));

import {
  publishCriteria,
  updateCriteriaTxId,
  createSubmission,
  updateSubmissionHedera,
  createReviewAssignment,
  updateSubmissionStatus,
  updateSubmissionTxId,
  updateAssignmentTimelineIndex,
} from './mutations';

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([{ id: 'sub-1' }]);
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsertReturning.mockResolvedValue([{ id: 'criteria-1' }]);
});

// ===========================================================================
// publishCriteria
// ===========================================================================

describe('publishCriteria', () => {
  it('inserts criteria and atomically transitions submission status', async () => {
    const result = await publishCriteria({
      submissionId: 'sub-1',
      criteriaJson: '{"criteria":[]}',
      criteriaHash: 'hash-abc',
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: 'sub-1',
        criteriaJson: '{"criteria":[]}',
        criteriaHash: 'hash-abc',
      }),
    );
    // Atomic status guard via WHERE clause (no SELECT pre-check)
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'criteria_published',
        criteriaHash: 'hash-abc',
      }),
    );
    expect(result).toEqual({ id: 'criteria-1' });
  });

  it('returns null when status guard rejects (wrong status or not found)', async () => {
    // Update returns empty → submission was in wrong status or doesn't exist
    mockReturning.mockResolvedValue([]);
    const result = await publishCriteria({
      submissionId: 'sub-1',
      criteriaJson: '{}',
      criteriaHash: 'hash',
    });
    expect(result).toBeNull();
    // Insert still happens (criteria row created), but null returned due to status guard
    expect(mockInsert).toHaveBeenCalled();
  });

  it('skips status update when criteria insert returns empty', async () => {
    mockInsertReturning.mockResolvedValue([]);
    const result = await publishCriteria({
      submissionId: 'sub-1',
      criteriaJson: '{}',
      criteriaHash: 'hash',
    });
    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// updateCriteriaTxId
// ===========================================================================

describe('updateCriteriaTxId', () => {
  it('updates both submissions and reviewCriteria in parallel', async () => {
    await updateCriteriaTxId('sub-1', 'tx-123');

    // Should have been called twice (once for submissions, once for reviewCriteria)
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith({ criteriaTxId: 'tx-123' });
    expect(mockSet).toHaveBeenCalledWith({ hederaTxId: 'tx-123' });
  });
});

// ===========================================================================
// createSubmission
// ===========================================================================

describe('createSubmission', () => {
  it('inserts with paperId, journalId, versionId', async () => {
    const result = await createSubmission({
      paperId: 'paper-1',
      journalId: 'journal-1',
      versionId: 'version-1',
    });
    expect(mockInsertValues).toHaveBeenCalledWith({
      paperId: 'paper-1',
      journalId: 'journal-1',
      versionId: 'version-1',
    });
    expect(result).toEqual({ id: 'criteria-1' });
  });

  it('returns null when insert fails', async () => {
    mockInsertReturning.mockResolvedValue([]);
    const result = await createSubmission({
      paperId: 'p-1',
      journalId: 'j-1',
      versionId: 'v-1',
    });
    expect(result).toBeNull();
  });
});

// ===========================================================================
// updateSubmissionHedera
// ===========================================================================

describe('updateSubmissionHedera', () => {
  it('sets hederaTxId and hederaTimestamp', async () => {
    await updateSubmissionHedera('sub-1', 'tx-1', 'ts-1');
    expect(mockSet).toHaveBeenCalledWith({
      hederaTxId: 'tx-1',
      hederaTimestamp: 'ts-1',
    });
  });

  it('returns null when no row matched', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await updateSubmissionHedera('missing', 'tx-1', 'ts-1');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// createReviewAssignment
// ===========================================================================

describe('createReviewAssignment', () => {
  it('lowercases wallet and sets status to assigned', async () => {
    await createReviewAssignment({
      submissionId: 'sub-1',
      reviewerWallet: '0xABCDEF',
      deadline: '2025-02-01T00:00:00Z',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewerWallet: '0xabcdef',
        status: 'assigned',
        deadline: '2025-02-01T00:00:00Z',
      }),
    );
  });

  it('returns null when insert fails', async () => {
    mockInsertReturning.mockResolvedValue([]);
    const result = await createReviewAssignment({
      submissionId: 'sub-1',
      reviewerWallet: '0xabc',
      deadline: '2025-02-01T00:00:00Z',
    });
    expect(result).toBeNull();
  });
});

// ===========================================================================
// updateSubmissionStatus
// ===========================================================================

describe('updateSubmissionStatus', () => {
  it('updates status only', async () => {
    await updateSubmissionStatus('sub-1', 'accepted');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' }),
    );
  });

  it('merges extra fields into status update', async () => {
    await updateSubmissionStatus('sub-1', 'accepted', {
      decidedAt: '2025-03-01T00:00:00Z',
    } as Partial<Record<string, unknown>>);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'accepted',
        decidedAt: '2025-03-01T00:00:00Z',
      }),
    );
  });

  it('returns null when no row matched', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await updateSubmissionStatus('missing', 'accepted');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// updateSubmissionTxId
// ===========================================================================

describe('updateSubmissionTxId', () => {
  it.each([
    ['decisionTxId' as const, 'tx-123'],
    ['authorResponseTxId' as const, 'tx-456'],
    ['hederaTxId' as const, 'tx-789'],
  ])('sets %s dynamically', async (field, txId) => {
    await updateSubmissionTxId('sub-1', field, txId);
    expect(mockSet).toHaveBeenCalledWith({ [field]: txId });
  });
});

// ===========================================================================
// updateAssignmentTimelineIndex
// ===========================================================================

describe('updateAssignmentTimelineIndex', () => {
  it('sets timelineEnforcerIndex on assignment row', async () => {
    await updateAssignmentTimelineIndex('assign-1', 42);
    expect(mockSet).toHaveBeenCalledWith({ timelineEnforcerIndex: 42 });
  });

  it('returns null when no row matched', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await updateAssignmentTimelineIndex('missing', 0);
    expect(result).toBeNull();
  });
});
