/**
 * Tests for editor/lib/journal.ts — pure mapping & utility functions.
 * No mocks needed; these transform DB shapes into display shapes.
 */

import {
  computeSubmissionStats,
  deriveStage,
  mapDbToJournalSubmission,
  mapDbToPoolReviewer,
  mapDbToPaperCardData,
  buildReviewerPool,
  buildNameByWallet,
  mapDbToEditorProfile,
  mapDbToReviewerWithStatus,
  mapDbToJournalIssue,
  filterPoolByJournal,
  buildPoolReviewersWithStatus,
  buildReviewStatusMap,
} from './journal';
import type {
  DbJournalSubmission,
  DbReviewer,
  DbReputationScore,
  DbJournalIssue,
  DbJournalReviewerWithStatus,
} from '../queries';
import type { PoolReviewer } from '../types';

// ---------------------------------------------------------------------------
// Helpers to build minimal DB shapes
// ---------------------------------------------------------------------------

function makeSub(
  overrides: Record<string, unknown> & { status: string },
): DbJournalSubmission {
  return {
    id: 'sub-1',
    paperId: 'paper-1',
    journalId: 'journal-1',
    submittedAt: '2025-01-15T10:00:00Z',
    reviewDeadline: null,
    criteriaHash: null,
    criteriaMet: null,
    decision: null,
    reviewerWallets: null,
    reviewAssignments: [],
    reviewCriteria: [],
    reviews: [],
    paper: {
      id: 'paper-1',
      title: 'Test Paper',
      abstract: 'A short abstract.',
      owner: { displayName: 'Alice', walletAddress: '0xaaa' },
      versions: [{ paperHash: 'abc123def456' }],
      litDataToEncryptHash: null,
      litAccessConditionsJson: null,
    },
    ...overrides,
  } as unknown as DbJournalSubmission;
}

function makeReviewer(overrides: Partial<DbReviewer> = {}): DbReviewer {
  return {
    id: 'user-1',
    walletAddress: '0xreviewer1',
    displayName: 'Reviewer One',
    orcidId: '0000-0001-0000-0001',
    institution: 'MIT',
    researchFields: ['Computer Science'],
    ...overrides,
  } as unknown as DbReviewer;
}

function makeScore(
  overrides: Partial<DbReputationScore> = {},
): DbReputationScore {
  return {
    userWallet: '0xreviewer1',
    overallScore: 80,
    reviewCount: 10,
    ...overrides,
  } as unknown as DbReputationScore;
}

// ===================================================================
// computeSubmissionStats
// ===================================================================

describe('computeSubmissionStats', () => {
  it('returns all zeros for empty array', () => {
    const stats = computeSubmissionStats([]);
    expect(stats.map((s) => s.value)).toEqual([0, 0, 0, 0, 0]);
  });

  it('counts submitted as new', () => {
    const stats = computeSubmissionStats([makeSub({ status: 'submitted' })]);
    expect(stats[0]).toEqual({ label: 'New Submissions', value: 1 });
  });

  it('counts viewed_by_editor as new', () => {
    const stats = computeSubmissionStats([
      makeSub({ status: 'viewed_by_editor' }),
    ]);
    expect(stats[0].value).toBe(1);
  });

  it('counts criteria_published as awaiting assignment', () => {
    const stats = computeSubmissionStats([
      makeSub({ status: 'criteria_published' }),
    ]);
    expect(stats[1]).toEqual({ label: 'Awaiting Assignment', value: 1 });
  });

  it('counts reviewers_assigned with <2 accepted as awaiting assignment', () => {
    const stats = computeSubmissionStats([
      makeSub({
        status: 'reviewers_assigned',
        reviewAssignments: [{ status: 'accepted' }],
      }),
    ]);
    expect(stats[1].value).toBe(1); // awaiting
    expect(stats[2].value).toBe(0); // under review
  });

  it('counts reviewers_assigned with >=2 accepted as under review', () => {
    const stats = computeSubmissionStats([
      makeSub({
        status: 'reviewers_assigned',
        reviewAssignments: [{ status: 'accepted' }, { status: 'accepted' }],
      }),
    ]);
    expect(stats[2].value).toBe(1); // under review
    expect(stats[1].value).toBe(0); // awaiting
  });

  it('counts submitted assignment status toward >=2 threshold', () => {
    const stats = computeSubmissionStats([
      makeSub({
        status: 'reviewers_assigned',
        reviewAssignments: [{ status: 'accepted' }, { status: 'submitted' }],
      }),
    ]);
    expect(stats[2].value).toBe(1); // under review
  });

  it('counts under_review, reviews_completed, rebuttal_open as under review', () => {
    const stats = computeSubmissionStats([
      makeSub({ status: 'under_review' }),
      makeSub({ status: 'reviews_completed' }),
      makeSub({ status: 'rebuttal_open' }),
    ]);
    expect(stats[2].value).toBe(3);
  });

  it('counts revision_requested as under review', () => {
    const stats = computeSubmissionStats([
      makeSub({ status: 'revision_requested' }),
    ]);
    expect(stats[2].value).toBe(1);
  });

  it('counts accepted and published as accepted', () => {
    const stats = computeSubmissionStats([
      makeSub({ status: 'accepted' }),
      makeSub({ status: 'published' }),
    ]);
    expect(stats[3]).toEqual({ label: 'Accepted Papers', value: 2 });
  });

  it('counts rejected with alert flag', () => {
    const stats = computeSubmissionStats([makeSub({ status: 'rejected' })]);
    expect(stats[4]).toEqual({
      label: 'Rejected Papers',
      value: 1,
      alert: true,
    });
  });

  it('handles mixed statuses', () => {
    const stats = computeSubmissionStats([
      makeSub({ status: 'submitted' }),
      makeSub({ status: 'under_review' }),
      makeSub({ status: 'accepted' }),
      makeSub({ status: 'rejected' }),
    ]);
    expect(stats.map((s) => s.value)).toEqual([1, 0, 1, 1, 1]);
  });
});

// ===================================================================
// deriveStage
// ===================================================================

describe('deriveStage', () => {
  it('returns Published for published status', () => {
    expect(deriveStage('published', null, [], null, null)).toBe('Published');
  });

  it('returns Rejected for rejected status', () => {
    expect(deriveStage('rejected', null, [], null, null)).toBe('Rejected');
  });

  it('returns Decision Pending for reviews_completed', () => {
    expect(deriveStage('reviews_completed', null, [], null, null)).toBe(
      'Decision Pending',
    );
  });

  it('returns Under Review for under_review with no decision info', () => {
    expect(deriveStage('under_review', null, [], null, null)).toBe(
      'Under Review',
    );
  });

  it('returns Decision Pending for under_review when criteriaMet is true', () => {
    expect(deriveStage('under_review', null, [], true, null)).toBe(
      'Decision Pending',
    );
  });

  it('returns Under Review for under_review when criteriaMet is false', () => {
    // Fixed: criteriaMet = false should NOT trigger Decision Pending
    expect(deriveStage('under_review', null, [], false, null)).toBe(
      'Under Review',
    );
  });

  it('returns Decision Pending for under_review when decision is set', () => {
    expect(deriveStage('under_review', null, [], null, 'accept')).toBe(
      'Decision Pending',
    );
  });

  it('returns Under Review for rebuttal_open', () => {
    expect(deriveStage('rebuttal_open', null, [], null, null)).toBe(
      'Under Review',
    );
  });

  it('returns Reviewers Assigned when reviewerWallets present (submitted status)', () => {
    expect(deriveStage('submitted', null, ['0x1'], null, null)).toBe(
      'Reviewers Assigned',
    );
  });

  it('returns Criteria Published when criteriaHash present (submitted status)', () => {
    expect(deriveStage('submitted', 'hash123', [], null, null)).toBe(
      'Criteria Published',
    );
  });

  it('returns New for submitted with no criteria/reviewers', () => {
    expect(deriveStage('submitted', null, [], null, null)).toBe('New');
  });

  it('returns Reviewers Assigned for revision_requested with reviewers', () => {
    expect(deriveStage('revision_requested', 'hash', ['0x1'], null, null)).toBe(
      'Reviewers Assigned',
    );
  });

  it('returns Criteria Published for viewed_by_editor with criteria', () => {
    expect(deriveStage('viewed_by_editor', 'hash', [], null, null)).toBe(
      'Criteria Published',
    );
  });

  it('returns New for viewed_by_editor with nothing else', () => {
    expect(deriveStage('viewed_by_editor', null, [], null, null)).toBe('New');
  });

  it('reviewers check takes priority over criteria check', () => {
    expect(deriveStage('submitted', 'hash', ['0x1'], null, null)).toBe(
      'Reviewers Assigned',
    );
  });
});

// ===================================================================
// mapDbToJournalSubmission
// ===================================================================

describe('mapDbToJournalSubmission', () => {
  it('uses 1-based indexing', () => {
    const result = mapDbToJournalSubmission(
      makeSub({ status: 'submitted' }),
      0,
    );
    expect(result.id).toBe(1);

    const result2 = mapDbToJournalSubmission(
      makeSub({ status: 'submitted' }),
      4,
    );
    expect(result2.id).toBe(5);
  });

  it('uses last version hash', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).versions = [
      { paperHash: 'first_hash' },
      { paperHash: 'last_hash_abcdef1234567890' },
    ];
    const result = mapDbToJournalSubmission(sub, 0);
    expect(result.hash).toBe('last_has...7890');
  });

  it('returns dash when no versions', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).versions = [];
    const result = mapDbToJournalSubmission(sub, 0);
    expect(result.hash).toBe('—');
  });

  it('falls back to Unknown when owner is null', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).owner = null;
    const result = mapDbToJournalSubmission(sub, 0);
    expect(result.authors).toBe('Unknown');
  });

  it('coerces null reviewerWallets to empty array', () => {
    const sub = makeSub({ status: 'submitted', reviewerWallets: null });
    const result = mapDbToJournalSubmission(sub, 0);
    expect(result.reviewers).toEqual([]);
  });

  it('passes through existing reviewerWallets', () => {
    const sub = makeSub({
      status: 'submitted',
      reviewerWallets: ['0x1', '0x2'] as unknown,
    });
    const result = mapDbToJournalSubmission(sub, 0);
    expect(result.reviewers).toEqual(['0x1', '0x2']);
  });

  it('sets criteriaPublished from criteriaHash', () => {
    const sub = makeSub({ status: 'submitted', criteriaHash: 'abc' });
    const result = mapDbToJournalSubmission(sub, 0);
    expect(result.criteriaPublished).toBe(true);
  });

  it('sets criteriaPublished false when no hash', () => {
    const sub = makeSub({ status: 'submitted', criteriaHash: null });
    const result = mapDbToJournalSubmission(sub, 0);
    expect(result.criteriaPublished).toBe(false);
  });
});

// ===================================================================
// mapDbToPoolReviewer
// ===================================================================

describe('mapDbToPoolReviewer', () => {
  it('maps basic reviewer fields', () => {
    const result = mapDbToPoolReviewer(makeReviewer());
    expect(result.name).toBe('Reviewer One');
    expect(result.wallet).toBe('0xreviewer1');
    expect(result.field).toBe('Computer Science');
    expect(result.institution).toBe('MIT');
    expect(result.orcid).toBe('0000-0001-0000-0001');
  });

  it('falls back score to 0 when no scoreRow', () => {
    const result = mapDbToPoolReviewer(makeReviewer());
    expect(result.score).toBe(0);
    expect(result.reviews).toBe(0);
  });

  it('converts score to five-point scale', () => {
    const result = mapDbToPoolReviewer(
      makeReviewer(),
      makeScore({ overallScore: 80 }),
    );
    expect(result.score).toBe(4); // 80/20 = 4
    expect(result.reviews).toBe(10);
  });

  it('uses wallet as name when displayName is null', () => {
    const result = mapDbToPoolReviewer(makeReviewer({ displayName: null }));
    expect(result.name).toBe('0xreviewer1');
  });

  it('uses dash for empty researchFields', () => {
    const result = mapDbToPoolReviewer(makeReviewer({ researchFields: [] }));
    expect(result.field).toBe('—');
  });
});

// ===================================================================
// mapDbToPaperCardData
// ===================================================================

describe('mapDbToPaperCardData', () => {
  it('truncates abstract at 180 chars', () => {
    const longAbstract = 'A'.repeat(200);
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).abstract = longAbstract;
    const result = mapDbToPaperCardData(sub);
    // slice(0,177) + '…' (unicode ellipsis) = 178 chars
    expect(result.abstractSnippet).toHaveLength(178);
    expect(result.abstractSnippet.endsWith('\u2026')).toBe(true);
  });

  it('does not truncate short abstract', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).abstract = 'Short text';
    const result = mapDbToPaperCardData(sub);
    expect(result.abstractSnippet).toBe('Short text');
  });

  it('hasLitData=true when either lit field is set (OR logic)', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).litDataToEncryptHash = 'hash';
    (sub.paper as Record<string, unknown>).litAccessConditionsJson = '{}';
    const result = mapDbToPaperCardData(sub);
    expect(result.hasLitData).toBe(true);
  });

  it('hasLitData=true when only litDataToEncryptHash set (partial — errs toward protection)', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).litDataToEncryptHash = 'hash';
    (sub.paper as Record<string, unknown>).litAccessConditionsJson = null;
    const result = mapDbToPaperCardData(sub);
    expect(result.hasLitData).toBe(true);
    expect(result.fileUrl).toBeUndefined(); // no raw URL exposed
  });

  it('hasLitData=true when only litAccessConditionsJson set (partial — errs toward protection)', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).litDataToEncryptHash = null;
    (sub.paper as Record<string, unknown>).litAccessConditionsJson = '{}';
    const result = mapDbToPaperCardData(sub);
    expect(result.hasLitData).toBe(true);
    expect(result.fileUrl).toBeUndefined(); // no raw URL exposed
  });

  it('provides fileUrl when not encrypted and has file', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).versions = [
      { fileStorageKey: 'key-123' },
    ];
    const result = mapDbToPaperCardData(sub);
    expect(result.fileUrl).toBe(
      `/api/papers/${sub.paper.id}/content?format=raw`,
    );
  });

  it('omits fileUrl when lit-encrypted', () => {
    const sub = makeSub({ status: 'submitted' });
    (sub.paper as Record<string, unknown>).litDataToEncryptHash = 'h';
    (sub.paper as Record<string, unknown>).litAccessConditionsJson = '{}';
    (sub.paper as Record<string, unknown>).versions = [
      { fileStorageKey: 'key' },
    ];
    const result = mapDbToPaperCardData(sub);
    expect(result.fileUrl).toBeUndefined();
  });

  it('sets criteriaPublished from reviewCriteria length', () => {
    const sub = makeSub({
      status: 'submitted',
      reviewCriteria: [{ id: '1' }] as unknown,
    });
    const result = mapDbToPaperCardData(sub);
    expect(result.criteriaPublished).toBe(true);
  });
});

// ===================================================================
// buildReviewerPool / buildNameByWallet
// ===================================================================

describe('buildReviewerPool', () => {
  it('joins reviewers with scores by wallet', () => {
    const pool = buildReviewerPool(
      [
        makeReviewer({ walletAddress: '0xa' }),
        makeReviewer({ walletAddress: '0xb' }),
      ],
      [makeScore({ userWallet: '0xa', overallScore: 60 })],
    );
    expect(pool).toHaveLength(2);
    expect(pool[0].score).toBe(3); // 60/20
    expect(pool[1].score).toBe(0); // no match
  });

  it('handles empty arrays', () => {
    expect(buildReviewerPool([], [])).toEqual([]);
  });

  it('handles missing scores gracefully', () => {
    const pool = buildReviewerPool([makeReviewer()], []);
    expect(pool[0].score).toBe(0);
  });
});

describe('buildNameByWallet', () => {
  it('creates wallet -> name lookup', () => {
    const map = buildNameByWallet([
      makeReviewer({ walletAddress: '0xa', displayName: 'Alice' }),
      makeReviewer({ walletAddress: '0xb', displayName: null }),
    ]);
    expect(map['0xa']).toBe('Alice');
    expect(map['0xb']).toBe('0xb');
  });
});

// ===================================================================
// mapDbToEditorProfile
// ===================================================================

describe('mapDbToEditorProfile', () => {
  const mockGetInitials = (name: string) => name.slice(0, 2).toUpperCase();

  it('maps full profile', () => {
    const result = mapDbToEditorProfile(
      { displayName: 'Dr. Smith', institution: 'Oxford' },
      { name: 'Nature' },
      mockGetInitials,
    );
    expect(result).toEqual({
      name: 'Dr. Smith',
      initials: 'DR',
      affiliation: 'Oxford',
      journalName: 'Nature',
    });
  });

  it('falls back to Editor when user is null', () => {
    const result = mapDbToEditorProfile(
      null,
      { name: 'Nature' },
      mockGetInitials,
    );
    expect(result.name).toBe('Editor');
    expect(result.affiliation).toBe('—');
  });

  it('falls back to dash when journal is null', () => {
    const result = mapDbToEditorProfile(
      { displayName: 'Ed', institution: null },
      null,
      mockGetInitials,
    );
    expect(result.journalName).toBe('—');
    expect(result.affiliation).toBe('—');
  });
});

// ===================================================================
// mapDbToReviewerWithStatus
// ===================================================================

describe('mapDbToReviewerWithStatus', () => {
  it('maps assigned → pending', () => {
    const result = mapDbToReviewerWithStatus({
      id: '1',
      reviewerWallet: '0xa',
      status: 'assigned',
    });
    expect(result.status).toBe('pending');
    expect(result.hasComment).toBe(false);
  });

  it('maps accepted → in_progress', () => {
    const result = mapDbToReviewerWithStatus({
      id: '1',
      reviewerWallet: '0xa',
      status: 'accepted',
    });
    expect(result.status).toBe('in_progress');
  });

  it('maps submitted → complete with hasComment=true', () => {
    const result = mapDbToReviewerWithStatus({
      id: '1',
      reviewerWallet: '0xa',
      status: 'submitted',
    });
    expect(result.status).toBe('complete');
    expect(result.hasComment).toBe(true);
  });

  it('maps declined → rejected', () => {
    const result = mapDbToReviewerWithStatus({
      id: '1',
      reviewerWallet: '0xa',
      status: 'declined',
    });
    expect(result.status).toBe('rejected');
  });

  it('maps late → late', () => {
    const result = mapDbToReviewerWithStatus({
      id: '1',
      reviewerWallet: '0xa',
      status: 'late',
    });
    expect(result.status).toBe('late');
  });

  it('falls back to pending for unknown status', () => {
    const result = mapDbToReviewerWithStatus({
      id: '1',
      reviewerWallet: '0xa',
      status: 'unknown_thing',
    });
    expect(result.status).toBe('pending');
  });

  it('uses nameByWallet for display name', () => {
    const result = mapDbToReviewerWithStatus(
      { id: '1', reviewerWallet: '0xabc', status: 'assigned' },
      { '0xabc': 'Alice' },
    );
    expect(result.name).toBe('Alice');
  });
});

// ===================================================================
// mapDbToJournalIssue
// ===================================================================

describe('mapDbToJournalIssue', () => {
  it('maps issue with papers', () => {
    const dbIssue = {
      id: 'issue-1',
      label: 'Vol 1',
      papers: [
        { submissionId: 'sub-1', submission: { paper: { title: 'Paper A' } } },
      ],
    } as unknown as DbJournalIssue;
    const result = mapDbToJournalIssue(dbIssue);
    expect(result).toEqual({
      id: 'issue-1',
      label: 'Vol 1',
      paperCount: 1,
      papers: [{ submissionId: 'sub-1', title: 'Paper A' }],
    });
  });

  it('uses Untitled when paper title is null', () => {
    const dbIssue = {
      id: 'issue-2',
      label: 'Vol 2',
      papers: [{ submissionId: 's1', submission: { paper: { title: null } } }],
    } as unknown as DbJournalIssue;
    const result = mapDbToJournalIssue(dbIssue);
    expect(result.papers![0].title).toBe('Untitled');
  });

  it('handles empty papers array', () => {
    const dbIssue = {
      id: 'issue-3',
      label: 'Vol 3',
      papers: [],
    } as unknown as DbJournalIssue;
    const result = mapDbToJournalIssue(dbIssue);
    expect(result.paperCount).toBe(0);
    expect(result.papers).toEqual([]);
  });
});

// ===================================================================
// filterPoolByJournal
// ===================================================================

describe('filterPoolByJournal', () => {
  const r1 = { wallet: '0xABC' } as unknown as PoolReviewer;
  const r2 = { wallet: '0xDEF' } as unknown as PoolReviewer;

  it('splits by wallet set membership', () => {
    const result = filterPoolByJournal([r1, r2], new Set(['0xabc']));
    expect(result.poolReviewers).toEqual([r1]);
    expect(result.nonPoolReviewers).toEqual([r2]);
  });

  it('performs case-insensitive matching on reviewer wallet', () => {
    const result = filterPoolByJournal([r1], new Set(['0xabc']));
    expect(result.poolReviewers).toHaveLength(1);
  });

  it('returns all as non-pool when set is empty', () => {
    const result = filterPoolByJournal([r1, r2], new Set());
    expect(result.poolReviewers).toHaveLength(0);
    expect(result.nonPoolReviewers).toHaveLength(2);
  });
});

// ===================================================================
// buildPoolReviewersWithStatus
// ===================================================================

describe('buildPoolReviewersWithStatus', () => {
  it('maps 3-way join rows', () => {
    const rows: DbJournalReviewerWithStatus[] = [
      {
        id: 'jr-1',
        journalId: 'j1',
        wallet: '0xabc',
        status: 'accepted',
        addedAt: '2025-01-01',
        respondedAt: null,
        user: {
          displayName: 'Alice',
          researchFields: ['AI'],
          orcidId: '0000-0001',
          institution: 'MIT',
        },
        score: { overallScore: 80, reviewCount: 5 },
      },
    ] as unknown as DbJournalReviewerWithStatus[];

    const result = buildPoolReviewersWithStatus(rows);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
    expect(result[0].score).toBe(4); // 80/20
    expect(result[0].poolInviteStatus).toBe('accepted');
  });

  it('falls back when user is null', () => {
    const rows = [
      {
        id: 'jr-2',
        wallet: '0xdef',
        status: 'pending',
        user: null,
        score: null,
      },
    ] as unknown as DbJournalReviewerWithStatus[];

    const result = buildPoolReviewersWithStatus(rows);
    expect(result[0].score).toBe(0);
    expect(result[0].field).toBe('—');
  });

  it('handles empty input', () => {
    expect(buildPoolReviewersWithStatus([])).toEqual([]);
  });
});

// ===================================================================
// buildReviewStatusMap
// ===================================================================

describe('buildReviewStatusMap', () => {
  it('skips submissions with no assignments', () => {
    const result = buildReviewStatusMap(
      [makeSub({ status: 'submitted', reviewAssignments: [] })],
      {},
    );
    expect(result).toEqual({});
  });

  it('maps assignments to reviewer status', () => {
    const sub = makeSub({
      status: 'under_review',
      reviewAssignments: [
        { id: 'a1', reviewerWallet: '0x1', status: 'accepted' },
        { id: 'a2', reviewerWallet: '0x2', status: 'submitted' },
      ],
    });
    const result = buildReviewStatusMap([sub], {
      '0x1': 'Alice',
      '0x2': 'Bob',
    });
    expect(result[sub.id]).toHaveLength(2);
    expect(result[sub.id][0].status).toBe('in_progress');
    expect(result[sub.id][1].status).toBe('complete');
  });

  it('attaches review content when includeReviewContent=true', () => {
    const sub = makeSub({
      status: 'accepted',
      reviewAssignments: [
        { id: 'a1', reviewerWallet: '0x1', status: 'submitted' },
      ],
      reviews: [
        {
          assignmentId: 'a1',
          strengths: 'Strong methods',
          weaknesses: 'Weak intro',
          recommendation: 'accept',
        },
      ],
    });
    const result = buildReviewStatusMap(
      [sub],
      {},
      { includeReviewContent: true },
    );
    expect(result[sub.id][0].reviewContent).toEqual({
      strengths: 'Strong methods',
      weaknesses: 'Weak intro',
      recommendation: 'accept',
    });
  });

  it('does not attach review content by default', () => {
    const sub = makeSub({
      status: 'accepted',
      reviewAssignments: [
        { id: 'a1', reviewerWallet: '0x1', status: 'submitted' },
      ],
      reviews: [
        {
          assignmentId: 'a1',
          strengths: 'S',
          weaknesses: 'W',
          recommendation: 'r',
        },
      ],
    });
    const result = buildReviewStatusMap([sub], {});
    expect(result[sub.id][0].reviewContent).toBeUndefined();
  });

  it('handles multiple submissions', () => {
    const sub1 = makeSub({
      id: 's1',
      status: 'under_review',
      reviewAssignments: [
        { id: 'a1', reviewerWallet: '0x1', status: 'assigned' },
      ],
    });
    const sub2 = makeSub({
      id: 's2',
      status: 'under_review',
      reviewAssignments: [
        { id: 'a2', reviewerWallet: '0x2', status: 'submitted' },
      ],
    });
    const result = buildReviewStatusMap([sub1, sub2], {});
    expect(Object.keys(result)).toEqual(['s1', 's2']);
  });
});
