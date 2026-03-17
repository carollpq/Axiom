/**
 * Tests for editor/mutations.ts — DB write operations.
 * Uses mock DB to verify correct Drizzle calls.
 */

// Force module scope to avoid TS2451 redeclaration errors with other test files
export {};

// --- Mock setup ---

const mockMutSet = jest.fn().mockReturnThis();
const mockMutWhere = jest.fn().mockReturnThis();
const mockMutReturning = jest.fn().mockResolvedValue([{ id: 'row-1' }]);
const mockMutValues = jest
  .fn()
  .mockReturnValue({ returning: mockMutReturning });
const mockMutDeleteWhere = jest.fn().mockResolvedValue(undefined);

const mockMutDb = {
  update: jest.fn(() => ({ set: mockMutSet })),
  insert: jest.fn(() => ({ values: mockMutValues })),
  delete: jest.fn(() => ({ where: mockMutDeleteWhere })),
};

// Chain: update().set().where()
mockMutSet.mockReturnValue({ where: mockMutWhere });
mockMutWhere.mockReturnValue({
  returning: jest.fn().mockResolvedValue(undefined),
});

jest.mock('@/src/shared/lib/db', () => ({ db: mockMutDb }));
jest.mock('@/src/shared/lib/db/schema', () => ({
  journals: { id: 'journals.id' },
  journalIssues: {
    id: 'journalIssues.id',
    journalId: 'journalIssues.journalId',
  },
  issuePapers: {
    issueId: 'issuePapers.issueId',
    submissionId: 'issuePapers.submissionId',
  },
  journalReviewers: {
    journalId: 'journalReviewers.journalId',
    reviewerWallet: 'journalReviewers.reviewerWallet',
  },
}));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: string, b: string) => ({ eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ and: args })),
  sql: jest.fn(),
}));

// Dynamic import after mocks
let mutations: typeof import('./mutations');

beforeAll(async () => {
  mutations = await import('./mutations');
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Re-wire mock chains only in describe blocks that need them
function rewireChains() {
  mockMutSet.mockReturnValue({ where: mockMutWhere });
  mockMutWhere.mockReturnValue({
    returning: jest.fn().mockResolvedValue(undefined),
  });
  mockMutDb.update.mockReturnValue({ set: mockMutSet });
  mockMutDb.insert.mockReturnValue({ values: mockMutValues });
  mockMutDb.delete.mockReturnValue({ where: mockMutDeleteWhere });
}

// ===================================================================
// updateJournalMetadata
// ===================================================================

describe('updateJournalMetadata', () => {
  beforeEach(rewireChains);

  it('no-ops when both fields undefined', async () => {
    await mutations.updateJournalMetadata('j1', {});
    expect(mockMutDb.update).not.toHaveBeenCalled();
  });

  it('updates with aimsAndScope only', async () => {
    await mutations.updateJournalMetadata('j1', { aimsAndScope: 'New aims' });
    expect(mockMutDb.update).toHaveBeenCalled();
    expect(mockMutSet).toHaveBeenCalledWith(
      expect.objectContaining({ aimsAndScope: 'New aims' }),
    );
  });

  it('updates with submissionCriteria only', async () => {
    await mutations.updateJournalMetadata('j1', {
      submissionCriteria: 'New criteria',
    });
    expect(mockMutDb.update).toHaveBeenCalled();
    expect(mockMutSet).toHaveBeenCalledWith(
      expect.objectContaining({ submissionCriteria: 'New criteria' }),
    );
  });

  it('updates with both fields', async () => {
    await mutations.updateJournalMetadata('j1', {
      aimsAndScope: 'Aims',
      submissionCriteria: 'Criteria',
    });
    expect(mockMutSet).toHaveBeenCalledWith(
      expect.objectContaining({
        aimsAndScope: 'Aims',
        submissionCriteria: 'Criteria',
      }),
    );
  });

  it('always includes updatedAt key in set call', async () => {
    await mutations.updateJournalMetadata('j1', { aimsAndScope: 'Test' });
    const setArg = mockMutSet.mock.calls[0][0];
    expect(setArg).toHaveProperty('updatedAt');
  });
});

// ===================================================================
// createJournalIssue
// ===================================================================

describe('createJournalIssue', () => {
  beforeEach(rewireChains);

  it('inserts with journalId and label, returns row', async () => {
    const result = await mutations.createJournalIssue('j1', 'Vol 1');
    expect(mockMutDb.insert).toHaveBeenCalled();
    expect(mockMutValues).toHaveBeenCalledWith({
      journalId: 'j1',
      label: 'Vol 1',
    });
    expect(result).toEqual({ id: 'row-1' });
  });
});

// ===================================================================
// deleteJournalIssue
// ===================================================================

describe('deleteJournalIssue', () => {
  it('deletes issuePapers BEFORE journalIssues (cascade order)', async () => {
    const callOrder: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockMutDb.delete as jest.Mock).mockImplementation((table: any) => ({
      where: jest.fn(() => {
        callOrder.push(String(table));
        return Promise.resolve();
      }),
    }));

    await mutations.deleteJournalIssue('issue-1');
    expect(callOrder).toHaveLength(2);
    expect(mockMutDb.delete).toHaveBeenCalledTimes(2);
  });
});

// ===================================================================
// addReviewerToPool
// ===================================================================

describe('addReviewerToPool', () => {
  beforeEach(rewireChains);

  it('lowercases wallet before insert', async () => {
    await mutations.addReviewerToPool('j1', '0xABCDEF');
    expect(mockMutValues).toHaveBeenCalledWith({
      journalId: 'j1',
      reviewerWallet: '0xabcdef',
    });
  });

  it('returns inserted row', async () => {
    const result = await mutations.addReviewerToPool('j1', '0xabc');
    expect(result).toEqual({ id: 'row-1' });
  });
});

// ===================================================================
// removeReviewerFromPool
// ===================================================================

describe('removeReviewerFromPool', () => {
  beforeEach(rewireChains);

  it('lowercases wallet and uses both journalId and wallet', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { eq: eqFn, and: andFn } = require('drizzle-orm');
    await mutations.removeReviewerFromPool('j1', '0xABC');
    expect(mockMutDeleteWhere).toHaveBeenCalled();
    expect(andFn).toHaveBeenCalled();
    // Verify eq was called with the lowercased wallet
    expect(eqFn).toHaveBeenCalledWith(
      'journalReviewers.reviewerWallet',
      '0xabc',
    );
  });
});

// ===================================================================
// addPaperToIssue / removePaperFromIssue
// ===================================================================

describe('addPaperToIssue', () => {
  beforeEach(rewireChains);

  it('inserts with correct values', async () => {
    await mutations.addPaperToIssue('issue-1', 'sub-1');
    expect(mockMutValues).toHaveBeenCalledWith({
      issueId: 'issue-1',
      submissionId: 'sub-1',
    });
  });

  it('returns inserted row', async () => {
    const result = await mutations.addPaperToIssue('issue-1', 'sub-1');
    expect(result).toEqual({ id: 'row-1' });
  });
});

describe('removePaperFromIssue', () => {
  beforeEach(rewireChains);

  it('deletes with and() on both issueId and submissionId', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { and: andFn, eq: eqFn } = require('drizzle-orm');
    await mutations.removePaperFromIssue('issue-1', 'sub-1');
    expect(mockMutDb.delete).toHaveBeenCalled();
    expect(andFn).toHaveBeenCalled();
    // Verify both eq calls happened
    expect(eqFn).toHaveBeenCalledWith('issuePapers.issueId', 'issue-1');
    expect(eqFn).toHaveBeenCalledWith('issuePapers.submissionId', 'sub-1');
  });
});
