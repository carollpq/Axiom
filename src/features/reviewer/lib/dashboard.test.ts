/**
 * Tests for dashboard mappers — pure functions, no mocks.
 */

import {
  mapDbToAssignedReview,
  mapDbToCompletedReview,
  mapDbToReputationScores,
  mapDbToReputationBreakdown,
  mapDbToCompletedReviewExtended,
  mapDbToAssignedReviewExtended,
  computeAvgDaysToDeadline,
  extractJournalNames,
  mapRatingsToInsights,
  extractEditorWallets,
  extractAuthors,
  buildPdfUrl,
} from './dashboard';

// ── Helpers ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeAssignedRow = (overrides: Record<string, unknown> = {}): any => ({
  id: 'assign-1',
  submissionId: 'sub-1',
  status: 'accepted',
  assignedAt: '2025-01-10T00:00:00Z',
  deadline: '2025-02-10T00:00:00Z',
  submittedAt: null,
  reviewerWallet: '0xreviewer',
  submission: {
    paper: {
      id: 'paper-1',
      title: 'Test Paper',
      abstract: 'Abstract text',
      versions: [
        {
          versionNumber: 1,
          paperHash: '0xhashlong1234567890',
          fileStorageKey: 'key',
        },
      ],
      contracts: [{ contributors: [{ contributorName: 'Alice' }] }],
      litAccessConditionsJson: null,
    },
    journal: { name: 'Nature', editorWallet: '0xeditor' },
    reviewCriteria: [],
  },
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeCompletedRow = (overrides: Record<string, unknown> = {}): any => ({
  ...makeAssignedRow({
    status: 'submitted',
    submittedAt: '2025-01-20T00:00:00Z',
  }),
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeCompletedExtendedRow = (
  overrides: Record<string, unknown> = {},
): any => ({
  ...makeCompletedRow(),
  reviews: [
    {
      id: 'rev-1',
      reviewerWallet: '0xreviewer',
      strengths: 'Strong methodology',
      weaknesses: 'Lacking data',
      questionsForAuthors: 'Q1?',
      recommendation: 'accept',
    },
  ],
  submission: {
    ...makeCompletedRow().submission,
    authorResponseStatus: null,
    rebuttals: [],
  },
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeReputationRow = (overrides: Record<string, unknown> = {}): any => ({
  overallScore: 50,
  timelinessScore: 80,
  editorRatingAvg: 60,
  authorRatingAvg: 40,
  publicationScore: 100,
  ...overrides,
});

// ===================================================================
// mapDbToAssignedReview
// ===================================================================

describe('mapDbToAssignedReview', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns status "Submitted" when status is submitted', () => {
    const row = makeAssignedRow({ status: 'submitted' });
    const result = mapDbToAssignedReview(row, 0);
    expect(result.status).toBe('Submitted');
  });

  it('returns "Late" when past deadline', () => {
    jest.setSystemTime(new Date('2025-03-01T00:00:00Z'));
    const row = makeAssignedRow({ deadline: '2025-02-01T00:00:00Z' });
    const result = mapDbToAssignedReview(row, 0);
    expect(result.status).toBe('Late');
    expect(result.daysLeft).toBeLessThan(0);
  });

  it('returns "In Progress" when 3 days or less remain', () => {
    jest.setSystemTime(new Date('2025-02-08T00:00:00Z'));
    const row = makeAssignedRow({ deadline: '2025-02-10T00:00:00Z' });
    const result = mapDbToAssignedReview(row, 0);
    expect(result.status).toBe('In Progress');
  });

  it('returns "Pending" when 4+ days remain', () => {
    jest.setSystemTime(new Date('2025-01-15T00:00:00Z'));
    const row = makeAssignedRow({ deadline: '2025-02-10T00:00:00Z' });
    const result = mapDbToAssignedReview(row, 0);
    expect(result.status).toBe('Pending');
  });

  it('null deadline → "Pending" (not "In Progress")', () => {
    const row = makeAssignedRow({ deadline: null });
    const result = mapDbToAssignedReview(row, 0);
    expect(result.daysLeft).toBe(0);
    expect(result.status).toBe('Pending');
  });

  it('uses 1-based id from index', () => {
    const result = mapDbToAssignedReview(makeAssignedRow(), 4);
    expect(result.id).toBe(5);
  });

  it('uses journal fallback "—" when null', () => {
    const row = makeAssignedRow();
    row.submission.journal = null;
    const result = mapDbToAssignedReview(row, 0);
    expect(result.journal).toBe('—');
  });

  it('displays "—" for deadline when null', () => {
    const row = makeAssignedRow({ deadline: null });
    const result = mapDbToAssignedReview(row, 0);
    expect(result.deadline).toBe('—');
  });
});

// ===================================================================
// mapDbToCompletedReview
// ===================================================================

describe('mapDbToCompletedReview', () => {
  it('does not include dead editorRating/authorRating fields', () => {
    const result = mapDbToCompletedReview(makeCompletedRow(), 0);
    expect(result).not.toHaveProperty('editorRating');
    expect(result).not.toHaveProperty('authorRating');
  });

  it('truncates paper hash from last version', () => {
    const result = mapDbToCompletedReview(makeCompletedRow(), 0);
    expect(result.hash).not.toBe('0xhashlong1234567890');
    expect(result.hash.length).toBeLessThan('0xhashlong1234567890'.length);
  });

  it('returns "—" for hash when no versions', () => {
    const row = makeCompletedRow();
    row.submission.paper.versions = [];
    const result = mapDbToCompletedReview(row, 0);
    expect(result.hash).toBe('—');
  });

  it('falls back to assignedAt when submittedAt is null', () => {
    const row = makeCompletedRow({
      submittedAt: null,
      assignedAt: '2025-01-10T00:00:00Z',
    });
    const result = mapDbToCompletedReview(row, 0);
    expect(result.submitted).toBe('2025-01-10');
  });

  it('uses 1-based id from index', () => {
    const result = mapDbToCompletedReview(makeCompletedRow(), 2);
    expect(result.id).toBe(3);
  });
});

// ===================================================================
// mapDbToReputationScores
// ===================================================================

describe('mapDbToReputationScores', () => {
  it.each([
    [0, 0],
    [50, 2.5],
    [80, 4],
    [100, 5],
  ])('converts %i → %s', (input, expected) => {
    const result = mapDbToReputationScores(
      makeReputationRow({ overallScore: input }),
    );
    expect(result.overall).toBe(expected);
  });

  it('change defaults to 0 when no recentDelta provided', () => {
    const result = mapDbToReputationScores(makeReputationRow());
    expect(result.change).toBe(0);
  });

  it('change uses provided recentDelta', () => {
    const result = mapDbToReputationScores(makeReputationRow(), 5);
    expect(result.change).toBe(5);
  });

  it('change passes through negative recentDelta', () => {
    const result = mapDbToReputationScores(makeReputationRow(), -3);
    expect(result.change).toBe(-3);
  });
});

// ===================================================================
// mapDbToReputationBreakdown
// ===================================================================

describe('mapDbToReputationBreakdown', () => {
  it('returns 4 items with correct labels', () => {
    const result = mapDbToReputationBreakdown(makeReputationRow());
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.label)).toEqual([
      'Timeliness',
      'Editor Ratings',
      'Author Feedback',
      'Post-Publication',
    ]);
  });

  it('converts scores to 5-point scale', () => {
    const result = mapDbToReputationBreakdown(
      makeReputationRow({ timelinessScore: 80, editorRatingAvg: 60 }),
    );
    expect(result[0].value).toBe(4); // 80/20
    expect(result[1].value).toBe(3); // 60/20
  });
});

// ===================================================================
// computeAvgDaysToDeadline
// ===================================================================

describe('computeAvgDaysToDeadline', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns 0 for empty array', () => {
    expect(computeAvgDaysToDeadline([])).toBe(0);
  });

  it('excludes entries with no deadline', () => {
    jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const result = computeAvgDaysToDeadline([
      { deadline: null },
      { deadline: '2025-01-11T00:00:00Z' },
    ]);
    expect(result).toBe(10);
  });

  it('clamps past-due to 0', () => {
    jest.setSystemTime(new Date('2025-02-01T00:00:00Z'));
    const result = computeAvgDaysToDeadline([
      { deadline: '2025-01-01T00:00:00Z' }, // past due → 0
    ]);
    expect(result).toBe(0);
  });

  it('averages mixed deadlines', () => {
    jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const result = computeAvgDaysToDeadline([
      { deadline: '2025-01-11T00:00:00Z' }, // 10 days
      { deadline: '2025-01-21T00:00:00Z' }, // 20 days
    ]);
    expect(result).toBe(15);
  });

  it('rounds to 1 decimal place', () => {
    jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const result = computeAvgDaysToDeadline([
      { deadline: '2025-01-11T00:00:00Z' }, // 10
      { deadline: '2025-01-12T00:00:00Z' }, // 11
      { deadline: '2025-01-13T00:00:00Z' }, // 12
    ]);
    expect(result).toBe(11);
  });
});

// ===================================================================
// extractJournalNames
// ===================================================================

describe('extractJournalNames', () => {
  it('deduplicates names', () => {
    const a = [{ submission: { journal: { name: 'Nature' } } }];
    const c = [{ submission: { journal: { name: 'Nature' } } }];
    expect(extractJournalNames(a, c)).toEqual(['Nature']);
  });

  it('skips null journals', () => {
    const a = [{ submission: { journal: null } }];
    const c = [{ submission: { journal: { name: 'Science' } } }];
    expect(extractJournalNames(a, c)).toEqual(['Science']);
  });

  it('returns empty for empty inputs', () => {
    expect(extractJournalNames([], [])).toEqual([]);
  });
});

// ===================================================================
// mapRatingsToInsights
// ===================================================================

describe('mapRatingsToInsights', () => {
  it('filters null/empty comments', () => {
    const ratings = [
      {
        reviewId: 'r1',
        comment: null,
        overallRating: 4,
        createdAt: '2025-01-01',
      },
      {
        reviewId: 'r2',
        comment: '',
        overallRating: 3,
        createdAt: '2025-01-02',
      },
      {
        reviewId: 'r3',
        comment: 'Helpful',
        overallRating: 5,
        createdAt: '2025-01-03',
      },
    ];
    const result = mapRatingsToInsights(ratings);
    expect(result).toHaveLength(1);
    expect(result[0].comment).toBe('Helpful');
  });

  it('returns correct shape', () => {
    const result = mapRatingsToInsights([
      {
        reviewId: 'r1',
        comment: 'Great',
        overallRating: 5,
        createdAt: '2025-01-01',
      },
    ]);
    expect(result[0]).toEqual({
      reviewId: 'r1',
      comment: 'Great',
      overallRating: 5,
      createdAt: '2025-01-01',
    });
  });
});

// ===================================================================
// extractEditorWallets
// ===================================================================

describe('extractEditorWallets', () => {
  it('extracts wallets', () => {
    const rows = [
      { submission: { journal: { editorWallet: '0xabc' } } },
      { submission: { journal: { editorWallet: '0xdef' } } },
    ];
    expect(extractEditorWallets(rows)).toEqual(['0xabc', '0xdef']);
  });

  it('filters falsy wallets', () => {
    const rows = [
      { submission: { journal: null } },
      { submission: { journal: { editorWallet: '0xabc' } } },
    ];
    expect(extractEditorWallets(rows)).toEqual(['0xabc']);
  });
});

// ===================================================================
// extractAuthors
// ===================================================================

describe('extractAuthors', () => {
  it('flattens contributors', () => {
    const contracts = [
      {
        contributors: [
          { contributorName: 'Alice' },
          { contributorName: 'Bob' },
        ],
      },
      { contributors: [{ contributorName: 'Carol' }] },
    ];
    expect(extractAuthors(contracts)).toEqual(['Alice', 'Bob', 'Carol']);
  });

  it('skips null names', () => {
    const contracts = [
      { contributors: [{ contributorName: null }, { contributorName: 'Bob' }] },
    ];
    expect(extractAuthors(contracts)).toEqual(['Bob']);
  });

  it('returns empty for undefined contracts', () => {
    expect(extractAuthors(undefined)).toEqual([]);
  });
});

// ===================================================================
// buildPdfUrl
// ===================================================================

describe('buildPdfUrl', () => {
  it('returns url when fileStorageKey present', () => {
    const result = buildPdfUrl('paper-1', [{ fileStorageKey: 'key' }]);
    expect(result).toBe('/api/papers/paper-1/content?format=raw');
  });

  it('returns undefined when fileStorageKey absent', () => {
    const result = buildPdfUrl('paper-1', [{ fileStorageKey: null }]);
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty versions', () => {
    expect(buildPdfUrl('paper-1', [])).toBeUndefined();
  });
});

// ===================================================================
// mapDbToCompletedReviewExtended
// ===================================================================

describe('mapDbToCompletedReviewExtended', () => {
  it('finds reviewContent from matching wallet', () => {
    const row = makeCompletedExtendedRow();
    const result = mapDbToCompletedReviewExtended(row, 0);
    expect(result.reviewContent).toEqual({
      strengths: 'Strong methodology',
      weaknesses: 'Lacking data',
      questionsForAuthors: 'Q1?',
      recommendation: 'accept',
    });
  });

  it('returns undefined reviewContent when no matching review', () => {
    const row = makeCompletedExtendedRow({
      reviews: [],
      reviewerWallet: '0xother',
    });
    const result = mapDbToCompletedReviewExtended(row, 0);
    expect(result.reviewContent).toBeUndefined();
  });

  it('maps rebuttal data', () => {
    const row = makeCompletedExtendedRow();
    row.submission.rebuttals = [
      {
        status: 'resolved',
        resolution: 'upheld',
        editorNotes: 'Agreed',
        responses: [
          { reviewId: 'rev-1', position: 'disagree', justification: 'Unfair' },
        ],
      },
    ];
    const result = mapDbToCompletedReviewExtended(row, 0);
    expect(result.rebuttal?.status).toBe('resolved');
    expect(result.rebuttal?.responseForThisReview?.position).toBe('disagree');
  });

  it('resolves editor name from map', () => {
    const row = makeCompletedExtendedRow();
    const editorNames = { '0xeditor': 'Dr. Smith' };
    const result = mapDbToCompletedReviewExtended(row, 0, editorNames);
    expect(result.editorName).toBe('Dr. Smith');
  });
});

// ===================================================================
// mapDbToAssignedReviewExtended
// ===================================================================

describe('mapDbToAssignedReviewExtended', () => {
  it('includes base fields plus extended fields', () => {
    const row = makeAssignedRow();
    const result = mapDbToAssignedReviewExtended(row, 0);
    expect(result.title).toBe('Test Paper');
    expect(result.abstract).toBe('Abstract text');
    expect(result.authors).toEqual(['Alice']);
    expect(result.pdfUrl).toBe('/api/papers/paper-1/content?format=raw');
  });

  it('resolves editor name', () => {
    const row = makeAssignedRow();
    const result = mapDbToAssignedReviewExtended(row, 0, {
      '0xeditor': 'Editor Name',
    });
    expect(result.editorName).toBe('Editor Name');
  });

  it('hasLitData is false when litAccessConditionsJson is null', () => {
    const row = makeAssignedRow();
    const result = mapDbToAssignedReviewExtended(row, 0);
    expect(result.hasLitData).toBe(false);
  });

  it('hasLitData is true when litAccessConditionsJson is set', () => {
    const row = makeAssignedRow();
    row.submission.paper.litAccessConditionsJson = '{}';
    const result = mapDbToAssignedReviewExtended(row, 0);
    expect(result.hasLitData).toBe(true);
  });
});
