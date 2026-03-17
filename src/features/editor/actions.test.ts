/**
 * Tests for editor/actions.ts — Server Actions with auth + mutation delegation.
 */

import {
  mockRequireSession,
  resetAuthMocks,
  resetAuthMocksUnauthenticated,
} from '../../../tests/mocks/auth';
import {
  TEST_EDITOR_WALLET,
  TEST_WALLET_2,
} from '../../../tests/helpers/fixtures';
import { flushAfterCallbacks } from '../../../tests/setup';

// --- Mocks ---

const mockRequireJournalEditor = jest.fn();
const mockListJournals = jest.fn();

jest.mock('@/src/shared/lib/auth/auth', () => ({
  requireSession: mockRequireSession,
}));

jest.mock('@/src/features/editor/queries', () => ({
  requireJournalEditor: mockRequireJournalEditor,
  listJournals: mockListJournals,
}));

const mockUpdateJournalMetadata = jest.fn();
const mockCreateJournalIssue = jest.fn();
const mockAddPaperToIssue = jest.fn();
const mockRemovePaperFromIssue = jest.fn();
const mockAddReviewerToPool = jest.fn();
const mockRemoveReviewerFromPool = jest.fn();

jest.mock('@/src/features/editor/mutations', () => ({
  updateJournalMetadata: mockUpdateJournalMetadata,
  createJournalIssue: mockCreateJournalIssue,
  addPaperToIssue: mockAddPaperToIssue,
  removePaperFromIssue: mockRemovePaperFromIssue,
  addReviewerToPool: mockAddReviewerToPool,
  removeReviewerFromPool: mockRemoveReviewerFromPool,
}));

const mockCreateNotification = jest.fn();
jest.mock('@/src/features/notifications/mutations', () => ({
  createNotification: mockCreateNotification,
}));

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue([{ name: 'Test Journal' }]),
        })),
      })),
    })),
  },
}));
jest.mock('@/src/shared/lib/db/schema', () => ({
  journals: { id: 'id', name: 'name' },
}));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}));
jest.mock('@/src/shared/lib/routes', () => ({
  ROUTES: { reviewer: { root: '/reviewer' } },
}));

let actions: typeof import('./actions');

beforeAll(async () => {
  actions = await import('./actions');
});

beforeEach(() => {
  jest.clearAllMocks();
  resetAuthMocks(TEST_EDITOR_WALLET);
  mockRequireJournalEditor.mockResolvedValue({
    id: 'j1',
    name: 'Test Journal',
  });
  mockCreateJournalIssue.mockResolvedValue({ id: 'issue-1', label: 'Vol 1' });
  mockAddReviewerToPool.mockResolvedValue({ id: 'jr-1' });
  mockAddPaperToIssue.mockResolvedValue({ id: 'ip-1' });
});

// ===================================================================
// listJournalsAction
// ===================================================================

describe('listJournalsAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.listJournalsAction()).rejects.toThrow('Unauthorized');
  });

  it('delegates to listJournals', async () => {
    mockListJournals.mockResolvedValue([{ id: 'j1' }]);
    const result = await actions.listJournalsAction();
    expect(mockListJournals).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'j1' }]);
  });
});

// ===================================================================
// updateJournalAction
// ===================================================================

describe('updateJournalAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.updateJournalAction('j1', { aimsAndScope: 'x' }),
    ).rejects.toThrow('Unauthorized');
  });

  it('requires editor authorization', async () => {
    mockRequireJournalEditor.mockRejectedValue(new Error('Forbidden'));
    await expect(
      actions.updateJournalAction('j1', { aimsAndScope: 'x' }),
    ).rejects.toThrow('Forbidden');
  });

  it('delegates to updateJournalMetadata', async () => {
    await actions.updateJournalAction('j1', { aimsAndScope: 'New aims' });
    expect(mockUpdateJournalMetadata).toHaveBeenCalledWith('j1', {
      aimsAndScope: 'New aims',
    });
  });

  it('returns { ok: true } on success', async () => {
    const result = await actions.updateJournalAction('j1', {});
    expect(result).toEqual({ ok: true });
  });
});

// ===================================================================
// createIssueAction
// ===================================================================

describe('createIssueAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.createIssueAction('j1', 'Vol 1')).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('requires editor authorization', async () => {
    mockRequireJournalEditor.mockRejectedValue(new Error('Forbidden'));
    await expect(actions.createIssueAction('j1', 'Vol 1')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('throws on empty label', async () => {
    await expect(actions.createIssueAction('j1', '')).rejects.toThrow(
      'Label is required',
    );
  });

  it('throws on whitespace-only label', async () => {
    await expect(actions.createIssueAction('j1', '   ')).rejects.toThrow(
      'Label is required',
    );
  });

  it('trims label before passing to mutation', async () => {
    await actions.createIssueAction('j1', '  Vol 1  ');
    expect(mockCreateJournalIssue).toHaveBeenCalledWith('j1', 'Vol 1');
  });

  it('returns created issue', async () => {
    const result = await actions.createIssueAction('j1', 'Vol 1');
    expect(result).toEqual({ id: 'issue-1', label: 'Vol 1' });
  });
});

// ===================================================================
// addReviewerToPoolAction
// ===================================================================

describe('addReviewerToPoolAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.addReviewerToPoolAction('j1', '0xreviewer'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws on empty wallet', async () => {
    await expect(actions.addReviewerToPoolAction('j1', '')).rejects.toThrow(
      'reviewerWallet is required',
    );
  });

  it('delegates to addReviewerToPool', async () => {
    await actions.addReviewerToPoolAction('j1', '0xreviewer');
    expect(mockAddReviewerToPool).toHaveBeenCalledWith('j1', '0xreviewer');
  });

  it('sends notification with correct userWallet', async () => {
    await actions.addReviewerToPoolAction('j1', TEST_WALLET_2);
    await flushAfterCallbacks();
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userWallet: TEST_WALLET_2 }),
    );
  });
});

// ===================================================================
// removeReviewerFromPoolAction
// ===================================================================

describe('removeReviewerFromPoolAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.removeReviewerFromPoolAction('j1', '0xr'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws on empty wallet', async () => {
    await expect(
      actions.removeReviewerFromPoolAction('j1', ''),
    ).rejects.toThrow('reviewerWallet is required');
  });

  it('delegates to removeReviewerFromPool', async () => {
    await actions.removeReviewerFromPoolAction('j1', '0xreviewer');
    expect(mockRemoveReviewerFromPool).toHaveBeenCalledWith('j1', '0xreviewer');
  });
});

// ===================================================================
// addPaperToIssueAction
// ===================================================================

describe('addPaperToIssueAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.addPaperToIssueAction('j1', 'issue-1', 'sub-1'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws on empty submissionId', async () => {
    await expect(
      actions.addPaperToIssueAction('j1', 'issue-1', ''),
    ).rejects.toThrow('submissionId is required');
  });

  it('passes issueId (not journalId) to addPaperToIssue', async () => {
    await actions.addPaperToIssueAction('j1', 'issue-1', 'sub-1');
    expect(mockAddPaperToIssue).toHaveBeenCalledWith('issue-1', 'sub-1');
  });
});

// ===================================================================
// removePaperFromIssueAction
// ===================================================================

describe('removePaperFromIssueAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.removePaperFromIssueAction('j1', 'issue-1', 'sub-1'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws on empty submissionId', async () => {
    await expect(
      actions.removePaperFromIssueAction('j1', 'issue-1', ''),
    ).rejects.toThrow('submissionId is required');
  });

  it('delegates correctly', async () => {
    await actions.removePaperFromIssueAction('j1', 'issue-1', 'sub-1');
    expect(mockRemovePaperFromIssue).toHaveBeenCalledWith('issue-1', 'sub-1');
  });

  it('returns { ok: true }', async () => {
    const result = await actions.removePaperFromIssueAction(
      'j1',
      'issue-1',
      'sub-1',
    );
    expect(result).toEqual({ ok: true });
  });
});
