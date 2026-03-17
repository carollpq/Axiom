/**
 * Tests for submissions/actions.ts — editor pipeline actions.
 * Covers: publishCriteriaAction, assignReviewersAction, makeDecisionAction,
 *         markViewedAction, publishPaperAction.
 */

import {
  mockRequireSession,
  resetAuthMocks,
  resetAuthMocksUnauthenticated,
} from '../../../tests/mocks/auth';
import { TEST_EDITOR_WALLET } from '../../../tests/helpers/fixtures';
import { flushAfterCallbacks } from '../../../tests/setup';

// --- Mock dependencies ---

const mockRequireSubmissionEditor = jest.fn();
const mockRequireSubmissionAuthor = jest.fn();
jest.mock('@/src/features/submissions/queries', () => ({
  requireSubmissionEditor: mockRequireSubmissionEditor,
  requireSubmissionAuthor: mockRequireSubmissionAuthor,
}));

jest.mock('@/src/shared/lib/auth/auth', () => ({
  requireSession: mockRequireSession,
}));

const mockPublishCriteria = jest.fn();
const mockUpdateCriteriaTxId = jest.fn();
const mockCreateReviewAssignment = jest.fn();
const mockUpdateSubmissionStatus = jest.fn();
const mockUpdateSubmissionTxId = jest.fn();
const mockUpdateAssignmentTimelineIndex = jest.fn();

jest.mock('@/src/features/submissions/mutations', () => ({
  publishCriteria: mockPublishCriteria,
  updateCriteriaTxId: mockUpdateCriteriaTxId,
  createReviewAssignment: mockCreateReviewAssignment,
  updateSubmissionStatus: mockUpdateSubmissionStatus,
  updateSubmissionTxId: mockUpdateSubmissionTxId,
  updateAssignmentTimelineIndex: mockUpdateAssignmentTimelineIndex,
}));

const mockListReviewAssignmentsForSubmission = jest.fn();
const mockListReviewsForSubmission = jest.fn();
const mockGetPublishedCriteria = jest.fn();
jest.mock('@/src/features/reviews/queries', () => ({
  listReviewAssignmentsForSubmission: mockListReviewAssignmentsForSubmission,
  listReviewsForSubmission: mockListReviewsForSubmission,
  getPublishedCriteria: mockGetPublishedCriteria,
}));

const mockRecordReputation = jest.fn();
jest.mock('@/src/features/reviews/mutations', () => ({
  recordReputation: mockRecordReputation,
}));

jest.mock('@/src/shared/lib/hashing', () => ({
  canonicalJson: jest.fn((v: unknown) => JSON.stringify(v)),
  sha256: jest.fn().mockResolvedValue('mock-hash-abc'),
}));

const mockUpdatePaper = jest.fn();
jest.mock('@/src/features/papers/mutations', () => ({
  updatePaper: mockUpdatePaper,
}));

jest.mock('@/src/shared/lib/lit/access-control', () => ({
  addReviewersToAccessConditions: jest
    .fn()
    .mockReturnValue('{"updated": true}'),
}));

const mockOpenRebuttal = jest.fn();
jest.mock('@/src/features/rebuttals/mutations', () => ({
  openRebuttal: mockOpenRebuttal,
}));

const mockNotifyIfWallet = jest.fn();
const mockCreateNotification = jest.fn();
jest.mock('@/src/features/notifications/mutations', () => ({
  createNotification: mockCreateNotification,
  notifyIfWallet: mockNotifyIfWallet,
}));

jest.mock('@/src/shared/lib/routes', () => ({
  ROUTES: {
    researcher: { root: '/researcher', rebuttal: () => '/researcher/rebuttal' },
    editor: { root: '/editor' },
    reviewer: { root: '/reviewer' },
  },
}));

// Mock db for publishPaperAction's direct reviews query
jest.mock('@/src/shared/lib/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValue([
          { id: 'rev-1', reviewerWallet: '0xreviewer1' },
          { id: 'rev-2', reviewerWallet: '0xreviewer2' },
        ]),
      })),
    })),
    query: {
      reviewAssignments: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));
jest.mock('@/src/shared/lib/db/schema', () => ({
  reviewAssignments: {},
  reviews: {},
  submissions: {},
}));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
}));

// Dynamic import
let actions: typeof import('./actions');

beforeAll(async () => {
  actions = await import('./actions');
});

// --- Helpers ---

function makeSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    paperId: 'paper-1',
    status: 'submitted',
    reviewDeadlineDays: null,
    paper: {
      id: 'paper-1',
      title: 'Test Paper',
      owner: { walletAddress: '0xauthor', displayName: 'Author' },
      litAccessConditionsJson: null,
      litDataToEncryptHash: null,
    },
    journal: { editorWallet: TEST_EDITOR_WALLET },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  resetAuthMocks(TEST_EDITOR_WALLET);
  mockRequireSubmissionEditor.mockResolvedValue(makeSubmission());
  mockPublishCriteria.mockResolvedValue({
    id: 'criteria-1',
    criteriaHash: 'mock-hash-abc',
  });
  mockCreateReviewAssignment.mockResolvedValue({
    id: 'assign-1',
    reviewerWallet: '0xnew',
  });
  mockListReviewAssignmentsForSubmission.mockResolvedValue([]);
  mockUpdateSubmissionStatus.mockResolvedValue({ id: 'sub-1' });
  mockRecordReputation.mockResolvedValue(undefined);
});

// ===================================================================
// publishCriteriaAction
// ===================================================================

describe('publishCriteriaAction', () => {
  const criteria = [
    {
      id: 'c1',
      label: 'Methodology',
      evaluationType: 'yes_no_partially' as const,
      required: true,
    },
  ];

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.publishCriteriaAction('sub-1', criteria),
    ).rejects.toThrow('Unauthorized');
  });

  it('requires editor authorization', async () => {
    mockRequireSubmissionEditor.mockRejectedValue(new Error('Forbidden'));
    await expect(
      actions.publishCriteriaAction('sub-1', criteria),
    ).rejects.toThrow('Forbidden');
  });

  it('rejects if status is not submitted/viewed_by_editor', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'under_review' }),
    );
    await expect(
      actions.publishCriteriaAction('sub-1', criteria),
    ).rejects.toThrow(/Criteria can only be published/);
  });

  it('allows submitted status', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'submitted' }),
    );
    const result = await actions.publishCriteriaAction('sub-1', criteria);
    expect(result.criteriaHash).toBe('mock-hash-abc');
  });

  it('allows viewed_by_editor status', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'viewed_by_editor' }),
    );
    await actions.publishCriteriaAction('sub-1', criteria);
    expect(mockPublishCriteria).toHaveBeenCalled();
  });

  it('throws on empty criteria', async () => {
    await expect(actions.publishCriteriaAction('sub-1', [])).rejects.toThrow(
      'At least one criterion is required',
    );
  });

  it('throws when publishCriteria returns null', async () => {
    mockPublishCriteria.mockResolvedValue(null);
    await expect(
      actions.publishCriteriaAction('sub-1', criteria),
    ).rejects.toThrow('Failed to publish criteria');
  });

  it('calls publishCriteria with hash', async () => {
    await actions.publishCriteriaAction('sub-1', criteria);
    expect(mockPublishCriteria).toHaveBeenCalledWith({
      submissionId: 'sub-1',
      criteriaJson: expect.any(String),
      criteriaHash: 'mock-hash-abc',
    });
  });
});

// ===================================================================
// assignReviewersAction
// ===================================================================

describe('assignReviewersAction', () => {
  beforeEach(() => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'criteria_published' }),
    );
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.assignReviewersAction('sub-1', ['0x1']),
    ).rejects.toThrow('Unauthorized');
  });

  it('rejects invalid status', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'submitted' }),
    );
    await expect(
      actions.assignReviewersAction('sub-1', ['0x1']),
    ).rejects.toThrow(/Reviewers can only be assigned after criteria/);
  });

  it('allows criteria_published status', async () => {
    const result = await actions.assignReviewersAction('sub-1', ['0xnew']);
    expect(result.created).toBe(1);
  });

  it('allows reviewers_assigned status (partial assignment)', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'reviewers_assigned' }),
    );
    const result = await actions.assignReviewersAction('sub-1', ['0xnew']);
    expect(result.created).toBe(1);
  });

  it('throws on empty wallets', async () => {
    await expect(actions.assignReviewersAction('sub-1', [])).rejects.toThrow(
      'reviewerWallets is required',
    );
  });

  it('detects duplicates case-insensitively', async () => {
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { reviewerWallet: '0xABC' },
    ]);
    await expect(
      actions.assignReviewersAction('sub-1', ['0xabc']),
    ).rejects.toThrow('All reviewers are already assigned');
  });

  it('filters out existing, assigns only new wallets', async () => {
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { reviewerWallet: '0xexisting' },
    ]);
    await actions.assignReviewersAction('sub-1', ['0xexisting', '0xnew']);
    expect(mockCreateReviewAssignment).toHaveBeenCalledTimes(1);
    expect(mockCreateReviewAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ reviewerWallet: '0xnew' }),
    );
  });

  it('updates Lit conditions only when litAccessConditionsJson exists', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({
        status: 'criteria_published',
        paper: {
          id: 'paper-1',
          title: 'Test',
          owner: { walletAddress: '0xauthor' },
          litAccessConditionsJson: '{"existing": true}',
        },
      }),
    );
    await actions.assignReviewersAction('sub-1', ['0xnew']);
    expect(mockUpdatePaper).toHaveBeenCalledWith('paper-1', {
      litAccessConditionsJson: '{"updated": true}',
    });
  });

  it('does NOT update Lit conditions when litAccessConditionsJson is null', async () => {
    await actions.assignReviewersAction('sub-1', ['0xnew']);
    expect(mockUpdatePaper).not.toHaveBeenCalled();
  });

  it('uses deadlineDays param when provided', async () => {
    const before = Date.now();
    await actions.assignReviewersAction('sub-1', ['0xnew'], 14);
    const deadline = mockCreateReviewAssignment.mock.calls[0][0].deadline;
    const deadlineMs = new Date(deadline).getTime() - before;
    // 14 days ≈ 1209600000ms, allow 5s tolerance
    expect(deadlineMs).toBeGreaterThan(14 * 86_400_000 - 5000);
    expect(deadlineMs).toBeLessThan(14 * 86_400_000 + 5000);
  });

  it('falls back to submission.reviewDeadlineDays', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'criteria_published', reviewDeadlineDays: 30 }),
    );
    const before = Date.now();
    await actions.assignReviewersAction('sub-1', ['0xnew']);
    const deadline = mockCreateReviewAssignment.mock.calls[0][0].deadline;
    const deadlineMs = new Date(deadline).getTime() - before;
    expect(deadlineMs).toBeGreaterThan(30 * 86_400_000 - 5000);
    expect(deadlineMs).toBeLessThan(30 * 86_400_000 + 5000);
  });

  it('defaults to 21 days when no deadline specified', async () => {
    const before = Date.now();
    await actions.assignReviewersAction('sub-1', ['0xnew']);
    const deadline = mockCreateReviewAssignment.mock.calls[0][0].deadline;
    const deadlineMs = new Date(deadline).getTime() - before;
    expect(deadlineMs).toBeGreaterThan(21 * 86_400_000 - 5000);
    expect(deadlineMs).toBeLessThan(21 * 86_400_000 + 5000);
  });

  it('transitions status to reviewers_assigned', async () => {
    await actions.assignReviewersAction('sub-1', ['0xnew']);
    expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith(
      'sub-1',
      'reviewers_assigned',
    );
  });
});

// ===================================================================
// makeDecisionAction
// ===================================================================

describe('makeDecisionAction', () => {
  beforeEach(() => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'reviews_completed' }),
    );
    mockListReviewsForSubmission.mockResolvedValue([]);
    mockGetPublishedCriteria.mockResolvedValue(null);
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.makeDecisionAction('sub-1', { decision: 'accept', comment: '' }),
    ).rejects.toThrow('Unauthorized');
  });

  it('rejects invalid status', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'submitted' }),
    );
    await expect(
      actions.makeDecisionAction('sub-1', { decision: 'accept', comment: '' }),
    ).rejects.toThrow(/Decision can only be made/);
  });

  it('allows reviews_completed status', async () => {
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'accept',
      comment: 'Great paper',
    });
    expect(result.status).toBe('accepted');
  });

  it('allows rebuttal_open status', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'rebuttal_open' }),
    );
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'accept',
      comment: '',
    });
    expect(result.status).toBe('accepted');
  });

  it('allows under_review status', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'under_review' }),
    );
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'reject',
      comment: 'Not suitable',
    });
    expect(result.status).toBe('rejected');
  });

  it('rejects invalid decision via Zod', async () => {
    await expect(
      actions.makeDecisionAction('sub-1', {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        decision: 'invalid' as any,
        comment: '',
      }),
    ).rejects.toThrow(/Invalid option/);
  });

  it('maps accept → accepted', async () => {
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'accept',
      comment: '',
    });
    expect(result.status).toBe('accepted');
    expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith(
      'sub-1',
      'accepted',
      expect.any(Object),
    );
  });

  it('maps reject → rejected', async () => {
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'reject',
      comment: 'Not good',
    });
    expect(result.status).toBe('rejected');
  });

  it('maps revise → revision_requested', async () => {
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'revise',
      comment: 'Needs work',
    });
    expect(result.status).toBe('revision_requested');
  });

  // allCriteriaMet computation
  it('computes allCriteriaMet when all required criteria met in all reviews', async () => {
    mockGetPublishedCriteria.mockResolvedValue({
      criteriaJson: JSON.stringify([
        { id: 'c1', required: true },
        { id: 'c2', required: false },
      ]),
    });
    mockListReviewsForSubmission.mockResolvedValue([
      { criteriaEvaluations: JSON.stringify({ c1: { value: 'yes' } }) },
      { criteriaEvaluations: JSON.stringify({ c1: { value: 'yes' } }) },
    ]);
    // Accept should work fine
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'accept',
      comment: '',
    });
    expect(result.status).toBe('accepted');
  });

  // allCriteriaMet rejection tests — shared setup
  describe('when allCriteriaMet', () => {
    beforeEach(() => {
      mockGetPublishedCriteria.mockResolvedValue({
        criteriaJson: JSON.stringify([{ id: 'c1', required: true }]),
      });
      mockListReviewsForSubmission.mockResolvedValue([
        { criteriaEvaluations: JSON.stringify({ c1: { value: 'yes' } }) },
      ]);
    });

    it('throws when rejecting with no comment', async () => {
      await expect(
        actions.makeDecisionAction('sub-1', {
          decision: 'reject',
          comment: '',
        }),
      ).rejects.toThrow(/public justification comment is required/);
    });

    it('throws when rejecting with whitespace comment', async () => {
      await expect(
        actions.makeDecisionAction('sub-1', {
          decision: 'reject',
          comment: '   ',
        }),
      ).rejects.toThrow(/public justification comment is required/);
    });

    it('allows rejection when comment provided', async () => {
      const result = await actions.makeDecisionAction('sub-1', {
        decision: 'reject',
        comment: 'Methodological concerns despite criteria',
      });
      expect(result.status).toBe('rejected');
    });
  });

  // Editor rating
  it('mints editor_rating reputation with delta = rating - 3', async () => {
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { id: 'a1', reviewerWallet: '0xr1' },
    ]);
    await actions.makeDecisionAction('sub-1', {
      decision: 'accept',
      comment: '',
      reviewerRatings: { a1: 5 },
    });
    await flushAfterCallbacks();
    expect(mockRecordReputation).toHaveBeenCalledWith(
      '0xr1',
      'editor_rating',
      2, // 5 - 3
      expect.stringContaining('5/5'),
      expect.objectContaining({ rating: 5 }),
    );
  });
});

// ===================================================================
// markViewedAction
// ===================================================================

describe('markViewedAction', () => {
  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.markViewedAction('sub-1')).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('transitions submitted → viewed_by_editor', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'submitted' }),
    );
    const result = await actions.markViewedAction('sub-1');
    expect(result.status).toBe('viewed_by_editor');
    expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith(
      'sub-1',
      'viewed_by_editor',
    );
  });

  it('is idempotent — no-ops when already past submitted', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'viewed_by_editor' }),
    );
    const result = await actions.markViewedAction('sub-1');
    expect(result.alreadyViewed).toBe(true);
    expect(mockUpdateSubmissionStatus).not.toHaveBeenCalled();
  });

  it('returns current status when already viewed', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'criteria_published' }),
    );
    const result = await actions.markViewedAction('sub-1');
    expect(result.status).toBe('criteria_published');
    expect(result.alreadyViewed).toBe(true);
  });
});

// ===================================================================
// publishPaperAction
// ===================================================================

describe('publishPaperAction', () => {
  beforeEach(() => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'accepted' }),
    );
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.publishPaperAction('sub-1')).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('requires editor authorization', async () => {
    mockRequireSubmissionEditor.mockRejectedValue(new Error('Forbidden'));
    await expect(actions.publishPaperAction('sub-1')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('only accepts "accepted" status', async () => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'under_review' }),
    );
    await expect(actions.publishPaperAction('sub-1')).rejects.toThrow(
      'Only accepted papers can be published',
    );
  });

  it('transitions to published', async () => {
    const result = await actions.publishPaperAction('sub-1');
    expect(result.status).toBe('published');
    expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith(
      'sub-1',
      'published',
    );
  });

  it('mints paper_published reputation for each reviewer (delta +1)', async () => {
    await actions.publishPaperAction('sub-1');
    await flushAfterCallbacks();
    expect(mockRecordReputation).toHaveBeenCalledTimes(2);
    expect(mockRecordReputation).toHaveBeenCalledWith(
      '0xreviewer1',
      'paper_published',
      1,
      expect.stringContaining('published'),
      expect.objectContaining({ type: 'paper_published' }),
    );
    expect(mockRecordReputation).toHaveBeenCalledWith(
      '0xreviewer2',
      'paper_published',
      1,
      expect.any(String),
      expect.any(Object),
    );
  });

  it.each(['submitted', 'rejected', 'reviews_completed', 'published'])(
    'rejects %s status',
    async (status) => {
      mockRequireSubmissionEditor.mockResolvedValue(makeSubmission({ status }));
      await expect(actions.publishPaperAction('sub-1')).rejects.toThrow(
        'Only accepted papers can be published',
      );
    },
  );
});

// ===================================================================
// acceptAssignmentAction
// ===================================================================

describe('acceptAssignmentAction', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { db } = require('@/src/shared/lib/db');

  function makeAssignment(overrides: Record<string, unknown> = {}) {
    return {
      id: 'assign-1',
      reviewerWallet: TEST_EDITOR_WALLET.toLowerCase(),
      status: 'assigned',
      submission: makeSubmission({ status: 'reviewers_assigned' }),
      ...overrides,
    };
  }

  beforeEach(() => {
    db.query.reviewAssignments.findFirst.mockResolvedValue(makeAssignment());
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { id: 'assign-1', status: 'accepted' },
    ]);
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.acceptAssignmentAction('sub-1', 'accept'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws on invalid action', async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actions.acceptAssignmentAction('sub-1', 'invalid' as any),
    ).rejects.toThrow('Invalid action');
  });

  it('throws when no pending assignment found', async () => {
    db.query.reviewAssignments.findFirst.mockResolvedValue(null);
    await expect(
      actions.acceptAssignmentAction('sub-1', 'accept'),
    ).rejects.toThrow('No pending assignment found');
  });

  it('decline → updates assignment status to declined', async () => {
    const result = await actions.acceptAssignmentAction('sub-1', 'decline');
    expect(result.status).toBe('declined');
    expect(db.update).toHaveBeenCalled();
  });

  it('accept → updates assignment status to accepted', async () => {
    const result = await actions.acceptAssignmentAction('sub-1', 'accept');
    expect(result.status).toBe('accepted');
    expect(db.update).toHaveBeenCalled();
  });

  it('accept returns acceptedCount', async () => {
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { id: 'a1', status: 'accepted' },
      { id: 'a2', status: 'accepted' },
    ]);
    const result = await actions.acceptAssignmentAction('sub-1', 'accept');
    expect(result).toHaveProperty('acceptedCount', 2);
  });

  it('transitions to under_review when 2+ accepted and status is reviewers_assigned', async () => {
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { id: 'a1', status: 'accepted' },
      { id: 'a2', status: 'accepted' },
    ]);
    await actions.acceptAssignmentAction('sub-1', 'accept');
    expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith(
      'sub-1',
      'under_review',
    );
  });

  it('transitions to under_review when status is criteria_published', async () => {
    db.query.reviewAssignments.findFirst.mockResolvedValue(
      makeAssignment({
        submission: makeSubmission({ status: 'criteria_published' }),
      }),
    );
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { id: 'a1', status: 'accepted' },
      { id: 'a2', status: 'accepted' },
    ]);
    await actions.acceptAssignmentAction('sub-1', 'accept');
    expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith(
      'sub-1',
      'under_review',
    );
  });

  it('does NOT transition when fewer than 2 accepted', async () => {
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { id: 'a1', status: 'accepted' },
    ]);
    await actions.acceptAssignmentAction('sub-1', 'accept');
    expect(mockUpdateSubmissionStatus).not.toHaveBeenCalled();
  });

  it('decline sends notification to editor', async () => {
    await actions.acceptAssignmentAction('sub-1', 'decline');
    await flushAfterCallbacks();
    expect(mockNotifyIfWallet).toHaveBeenCalledWith(
      TEST_EDITOR_WALLET,
      expect.objectContaining({ type: 'assignment_declined' }),
    );
  });

  it('accept sends notification to editor', async () => {
    await actions.acceptAssignmentAction('sub-1', 'accept');
    await flushAfterCallbacks();
    expect(mockNotifyIfWallet).toHaveBeenCalledWith(
      TEST_EDITOR_WALLET,
      expect.objectContaining({ type: 'assignment_accepted' }),
    );
  });

  it('notifies author when transitioning to under_review', async () => {
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { id: 'a1', status: 'accepted' },
      { id: 'a2', status: 'accepted' },
    ]);
    await actions.acceptAssignmentAction('sub-1', 'accept');
    await flushAfterCallbacks();
    expect(mockNotifyIfWallet).toHaveBeenCalledWith(
      '0xauthor',
      expect.objectContaining({ type: 'reviewers_assigned' }),
    );
  });
});

// ===================================================================
// authorResponseAction
// ===================================================================

describe('authorResponseAction', () => {
  beforeEach(() => {
    // Reset to author wallet for these tests
    resetAuthMocks('0xauthor');
    mockRequireSubmissionAuthor.mockResolvedValue(
      makeSubmission({ status: 'reviews_completed' }),
    );
    mockOpenRebuttal.mockResolvedValue({ id: 'reb-1' });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.authorResponseAction('sub-1', 'accept'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws on invalid action', async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actions.authorResponseAction('sub-1', 'invalid' as any),
    ).rejects.toThrow('Invalid action');
  });

  it('requires reviews_completed status', async () => {
    mockRequireSubmissionAuthor.mockResolvedValue(
      makeSubmission({ status: 'under_review' }),
    );
    await expect(
      actions.authorResponseAction('sub-1', 'accept'),
    ).rejects.toThrow('Submission must be in reviews_completed status');
  });

  it('accept → updates status with authorResponseStatus accepted', async () => {
    const result = await actions.authorResponseAction('sub-1', 'accept');
    expect(result.status).toBe('accepted');
    expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith(
      'sub-1',
      'reviews_completed',
      expect.objectContaining({ authorResponseStatus: 'accepted' }),
    );
  });

  it('request_rebuttal → transitions to rebuttal_open', async () => {
    const result = await actions.authorResponseAction(
      'sub-1',
      'request_rebuttal',
    );
    expect(result.status).toBe('rebuttal_requested');
    expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith(
      'sub-1',
      'rebuttal_open',
      expect.objectContaining({ authorResponseStatus: 'rebuttal_requested' }),
    );
  });

  it('request_rebuttal → opens rebuttal with 14-day deadline', async () => {
    const before = Date.now();
    await actions.authorResponseAction('sub-1', 'request_rebuttal');
    const deadlineArg = mockOpenRebuttal.mock.calls[0][0].deadline;
    const deadlineMs = new Date(deadlineArg).getTime() - before;
    expect(deadlineMs).toBeGreaterThan(14 * 86_400_000 - 5000);
    expect(deadlineMs).toBeLessThan(14 * 86_400_000 + 5000);
  });

  it('request_rebuttal → returns rebuttalId', async () => {
    const result = await actions.authorResponseAction(
      'sub-1',
      'request_rebuttal',
    );
    expect(result.rebuttalId).toBe('reb-1');
  });

  it('accept → notifies editor', async () => {
    await actions.authorResponseAction('sub-1', 'accept');
    await flushAfterCallbacks();
    expect(mockNotifyIfWallet).toHaveBeenCalledWith(
      TEST_EDITOR_WALLET,
      expect.objectContaining({ type: 'author_response' }),
    );
  });

  it('request_rebuttal → notifies editor', async () => {
    await actions.authorResponseAction('sub-1', 'request_rebuttal');
    await flushAfterCallbacks();
    expect(mockNotifyIfWallet).toHaveBeenCalledWith(
      TEST_EDITOR_WALLET,
      expect.objectContaining({ type: 'author_response' }),
    );
  });
});

// ===================================================================
// makeDecisionAction — additional edge cases
// ===================================================================

describe('makeDecisionAction — editor_rating edge cases', () => {
  beforeEach(() => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'reviews_completed' }),
    );
    mockListReviewsForSubmission.mockResolvedValue([]);
    mockGetPublishedCriteria.mockResolvedValue(null);
    mockListReviewAssignmentsForSubmission.mockResolvedValue([
      { id: 'a1', reviewerWallet: '0xr1' },
    ]);
  });

  it('rating 3 → delta 0', async () => {
    await actions.makeDecisionAction('sub-1', {
      decision: 'accept',
      comment: '',
      reviewerRatings: { a1: 3 },
    });
    await flushAfterCallbacks();
    expect(mockRecordReputation).toHaveBeenCalledWith(
      '0xr1',
      'editor_rating',
      0, // 3 - 3
      expect.stringContaining('3/5'),
      expect.objectContaining({ rating: 3 }),
    );
  });

  it('rating 1 → delta -2', async () => {
    await actions.makeDecisionAction('sub-1', {
      decision: 'reject',
      comment: 'Bad',
      reviewerRatings: { a1: 1 },
    });
    await flushAfterCallbacks();
    expect(mockRecordReputation).toHaveBeenCalledWith(
      '0xr1',
      'editor_rating',
      -2, // 1 - 3
      expect.stringContaining('1/5'),
      expect.objectContaining({ rating: 1 }),
    );
  });

  it('rating 4 → delta +1', async () => {
    await actions.makeDecisionAction('sub-1', {
      decision: 'accept',
      comment: '',
      reviewerRatings: { a1: 4 },
    });
    await flushAfterCallbacks();
    expect(mockRecordReputation).toHaveBeenCalledWith(
      '0xr1',
      'editor_rating',
      1, // 4 - 3
      expect.stringContaining('4/5'),
      expect.objectContaining({ rating: 4 }),
    );
  });

  it('skips rating for unknown assignmentId', async () => {
    await actions.makeDecisionAction('sub-1', {
      decision: 'accept',
      comment: '',
      reviewerRatings: { unknown_id: 5 },
    });
    await flushAfterCallbacks();
    expect(mockRecordReputation).not.toHaveBeenCalled();
  });
});

describe('makeDecisionAction — allCriteriaMet with partially', () => {
  beforeEach(() => {
    mockRequireSubmissionEditor.mockResolvedValue(
      makeSubmission({ status: 'reviews_completed' }),
    );
    mockListReviewsForSubmission.mockResolvedValue([]);
    mockGetPublishedCriteria.mockResolvedValue(null);
  });

  it('partially met required criteria → allCriteriaMet is false (no justification needed)', async () => {
    mockGetPublishedCriteria.mockResolvedValue({
      criteriaJson: JSON.stringify([{ id: 'c1', required: true }]),
    });
    mockListReviewsForSubmission.mockResolvedValue([
      { criteriaEvaluations: JSON.stringify({ c1: { value: 'partially' } }) },
    ]);
    // Should NOT require justification since criteria not fully met
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'reject',
      comment: '',
    });
    expect(result.status).toBe('rejected');
  });

  it('mix of yes and no → allCriteriaMet is false', async () => {
    mockGetPublishedCriteria.mockResolvedValue({
      criteriaJson: JSON.stringify([{ id: 'c1', required: true }]),
    });
    mockListReviewsForSubmission.mockResolvedValue([
      { criteriaEvaluations: JSON.stringify({ c1: { value: 'yes' } }) },
      { criteriaEvaluations: JSON.stringify({ c1: { value: 'no' } }) },
    ]);
    const result = await actions.makeDecisionAction('sub-1', {
      decision: 'reject',
      comment: '',
    });
    expect(result.status).toBe('rejected');
  });
});
