/**
 * Tests for rebuttals/actions.ts — resolveRebuttalAction.
 */

import {
  mockRequireSession,
  resetAuthMocks,
  resetAuthMocksUnauthenticated,
} from '../../../tests/mocks/auth';
import { TEST_EDITOR_WALLET } from '../../../tests/helpers/fixtures';
import { flushAfterCallbacks } from '../../../tests/setup';

// --- Mocks ---

jest.mock('@/src/shared/lib/auth/auth', () => ({
  requireSession: mockRequireSession,
}));

const mockRequireRebuttalEditor = jest.fn();
const mockRequireRebuttalAuthor = jest.fn();
jest.mock('@/src/features/rebuttals/queries', () => ({
  requireRebuttalEditor: mockRequireRebuttalEditor,
  requireRebuttalAuthor: mockRequireRebuttalAuthor,
}));

const mockResolveRebuttal = jest.fn();
const mockSubmitRebuttalResponses = jest.fn();
const mockUpdateRebuttalHedera = jest.fn();
jest.mock('@/src/features/rebuttals/mutations', () => ({
  resolveRebuttal: mockResolveRebuttal,
  submitRebuttalResponses: mockSubmitRebuttalResponses,
  updateRebuttalHedera: mockUpdateRebuttalHedera,
}));

const mockRecordReputation = jest.fn();
jest.mock('@/src/features/reviews/mutations', () => ({
  recordReputation: mockRecordReputation,
}));

const mockNotifyIfWallet = jest.fn();
jest.mock('@/src/features/notifications/mutations', () => ({
  notifyIfWallet: mockNotifyIfWallet,
}));

jest.mock('@/src/shared/lib/hashing', () => ({
  canonicalJson: jest.fn((v: unknown) => JSON.stringify(v)),
  sha256: jest.fn().mockResolvedValue('mock-rebuttal-hash'),
}));

jest.mock('@/src/shared/lib/routes', () => ({
  ROUTES: {
    researcher: {
      root: '/researcher',
      rebuttal: (id: string) => `/researcher/rebuttal/${id}`,
    },
    editor: { root: '/editor', underReview: '/editor/under-review' },
    reviewer: { root: '/reviewer' },
  },
}));

let actions: typeof import('./actions');

beforeAll(async () => {
  actions = await import('./actions');
});

function makeRebuttal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reb-1',
    submissionId: 'sub-1',
    authorWallet: '0xauthor',
    status: 'submitted',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission: {
      journal: { editorWallet: TEST_EDITOR_WALLET },
      paper: { title: 'Test Paper' },
    },
    responses: [
      {
        reviewId: 'rev-1',
        review: { reviewerWallet: '0xreviewer1' },
        position: 'disagree',
        justification: 'I disagree because...',
      },
      {
        reviewId: 'rev-2',
        review: { reviewerWallet: '0xreviewer2' },
        position: 'agree',
        justification: 'I agree because...',
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  resetAuthMocks(TEST_EDITOR_WALLET);
  mockRequireRebuttalEditor.mockResolvedValue(makeRebuttal());
  mockResolveRebuttal.mockResolvedValue(undefined);
  mockRecordReputation.mockResolvedValue(undefined);
});

// ===================================================================
// respondToRebuttalAction
// ===================================================================

describe('respondToRebuttalAction', () => {
  const validInput = {
    responses: [
      {
        reviewId: 'rev-1',
        position: 'disagree' as const,
        justification: 'I disagree with this assessment strongly',
      },
    ],
  };

  beforeEach(() => {
    mockRequireRebuttalAuthor.mockResolvedValue(
      makeRebuttal({ status: 'open' }),
    );
    mockSubmitRebuttalResponses.mockResolvedValue({
      id: 'reb-1',
      status: 'submitted',
    });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.respondToRebuttalAction('reb-1', validInput),
    ).rejects.toThrow('Unauthorized');
  });

  it('requires open status', async () => {
    mockRequireRebuttalAuthor.mockResolvedValue(
      makeRebuttal({ status: 'submitted' }),
    );
    await expect(
      actions.respondToRebuttalAction('reb-1', validInput),
    ).rejects.toThrow('Rebuttal is not open for responses');
  });

  it('throws when deadline has passed', async () => {
    mockRequireRebuttalAuthor.mockResolvedValue(
      makeRebuttal({
        status: 'open',
        deadline: new Date(Date.now() - 1000).toISOString(),
      }),
    );
    await expect(
      actions.respondToRebuttalAction('reb-1', validInput),
    ).rejects.toThrow('Rebuttal deadline has passed');
  });

  it('validates input with Zod — empty responses', async () => {
    await expect(
      actions.respondToRebuttalAction('reb-1', { responses: [] }),
    ).rejects.toThrow(/too_small/);
  });

  it('validates input with Zod — justification too short', async () => {
    await expect(
      actions.respondToRebuttalAction('reb-1', {
        responses: [
          { reviewId: 'r1', position: 'agree', justification: 'short' },
        ],
      }),
    ).rejects.toThrow(/too_small/);
  });

  it('calls submitRebuttalResponses with rebuttalId and hash', async () => {
    await actions.respondToRebuttalAction('reb-1', validInput);
    expect(mockSubmitRebuttalResponses).toHaveBeenCalledWith(
      'reb-1',
      expect.arrayContaining([
        expect.objectContaining({ rebuttalId: 'reb-1', reviewId: 'rev-1' }),
      ]),
      'mock-rebuttal-hash',
    );
  });

  it('returns rebuttalHash', async () => {
    const result = await actions.respondToRebuttalAction('reb-1', validInput);
    expect(result.rebuttalHash).toBe('mock-rebuttal-hash');
  });

  it('notifies editor after submission', async () => {
    await actions.respondToRebuttalAction('reb-1', validInput);
    await flushAfterCallbacks();
    expect(mockNotifyIfWallet).toHaveBeenCalledWith(
      TEST_EDITOR_WALLET,
      expect.objectContaining({ type: 'rebuttal_submitted' }),
    );
  });
});

// ===================================================================
// resolveRebuttalAction
// ===================================================================

describe('resolveRebuttalAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.resolveRebuttalAction('reb-1', 'upheld', 'Notes'),
    ).rejects.toThrow('Unauthorized');
  });

  it('validates resolution via Zod (invalid value)', async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actions.resolveRebuttalAction('reb-1', 'invalid' as any, 'Notes'),
    ).rejects.toThrow();
  });

  it('auth guard runs before Zod validation (no info leak)', async () => {
    // requireSession is called first (line 117), then Zod parse (line 118)
    resetAuthMocksUnauthenticated();
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actions.resolveRebuttalAction('reb-1', 'invalid' as any, 'Notes'),
    ).rejects.toThrow('Unauthorized');
  });

  it('requires submitted status', async () => {
    mockRequireRebuttalEditor.mockResolvedValue(
      makeRebuttal({ status: 'open' }),
    );
    await expect(
      actions.resolveRebuttalAction('reb-1', 'upheld', 'Notes'),
    ).rejects.toThrow('Rebuttal must be submitted before resolving');
  });

  it('calls resolveRebuttal mutation', async () => {
    await actions.resolveRebuttalAction('reb-1', 'upheld', 'Upheld notes');
    expect(mockResolveRebuttal).toHaveBeenCalledWith({
      rebuttalId: 'reb-1',
      resolution: 'upheld',
      editorNotes: 'Upheld notes',
    });
  });

  it('upheld → rebuttal_upheld reputation with delta -2', async () => {
    await actions.resolveRebuttalAction('reb-1', 'upheld', 'Upheld');
    await flushAfterCallbacks();
    expect(mockRecordReputation).toHaveBeenCalledWith(
      expect.any(String),
      'rebuttal_upheld',
      -2,
      expect.any(String),
      expect.objectContaining({ type: 'rebuttal_upheld' }),
    );
  });

  it('rejected → rebuttal_overturned reputation with delta +1', async () => {
    await actions.resolveRebuttalAction('reb-1', 'rejected', 'Overturned');
    await flushAfterCallbacks();
    expect(mockRecordReputation).toHaveBeenCalledWith(
      expect.any(String),
      'rebuttal_overturned',
      1,
      expect.any(String),
      expect.objectContaining({ type: 'rebuttal_overturned' }),
    );
  });

  it('partial → NO reputation minting', async () => {
    await actions.resolveRebuttalAction('reb-1', 'partial', 'Partial notes');
    await flushAfterCallbacks();
    expect(mockRecordReputation).not.toHaveBeenCalled();
  });

  it('deduplicates reviewer wallets', async () => {
    mockRequireRebuttalEditor.mockResolvedValue(
      makeRebuttal({
        responses: [
          {
            reviewId: 'r1',
            review: { reviewerWallet: '0xsame' },
            position: 'agree',
            justification: 'j',
          },
          {
            reviewId: 'r2',
            review: { reviewerWallet: '0xsame' },
            position: 'disagree',
            justification: 'j',
          },
        ],
      }),
    );
    await actions.resolveRebuttalAction('reb-1', 'upheld', 'Upheld');
    await flushAfterCallbacks();
    // Should mint only once for 0xsame
    expect(mockRecordReputation).toHaveBeenCalledTimes(1);
  });

  it('mints for all unique reviewers on upheld', async () => {
    await actions.resolveRebuttalAction('reb-1', 'upheld', 'Upheld');
    await flushAfterCallbacks();
    // Default rebuttal has 2 unique reviewers
    expect(mockRecordReputation).toHaveBeenCalledTimes(2);
  });

  it('returns resolution', async () => {
    const result = await actions.resolveRebuttalAction(
      'reb-1',
      'upheld',
      'Notes',
    );
    expect(result).toEqual({ resolution: 'upheld' });
  });
});
