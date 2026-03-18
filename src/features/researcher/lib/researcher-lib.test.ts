/**
 * Tests for researcher lib utilities — dashboard, contract, submissions, review, paper-utils.
 * Pure functions, minimal mocking (only formatDate).
 */

// Mock formatDate to return deterministic output
jest.mock('@/src/shared/lib/format', () => ({
  formatDate: jest.fn((iso: string) => `formatted:${iso}`),
}));

import {
  deriveSubmissionDisplayStatus,
  mapPapersToSubmissionCards,
  computeStats,
} from './dashboard';
import {
  mapApiContributors,
  mapApiPapersToDrafts,
  mapContractsToSign,
  mapOwnedContractsForStatus,
  mapDbContractToSigned,
} from './contract';
import { buildSubmissionViewData } from './submissions';
import { anonymizeReviews } from './review';
import { extractAuthors } from './paper-utils';
import type {
  ContractContributor,
  Contract,
  Paper,
} from '@/src/shared/types/domain';
import type { DbPaperWithRelations } from '@/src/features/papers/queries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDbPaper(
  overrides: Record<string, unknown> = {},
): DbPaperWithRelations {
  return {
    id: 'paper-1',
    title: 'Test Paper',
    abstract: 'Abstract text',
    status: 'submitted',
    studyType: 'original',
    currentVersion: 1,
    ownerId: 'user-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    litDataToEncryptHash: null,
    litAccessConditionsJson: null,
    versions: [],
    contracts: [],
    submissions: [],
    owner: { walletAddress: '0xowner', displayName: 'Owner', orcidId: null },
    ...overrides,
  } as unknown as DbPaperWithRelations;
}

function makeContractContributor(
  overrides: Partial<ContractContributor> = {},
): ContractContributor {
  return {
    id: 'cc-1',
    contributorWallet: '0xabc',
    contributorName: 'Alice',
    contributionPct: 50,
    roleDescription: 'Lead Author',
    status: 'pending',
    signature: null,
    signedAt: null,
    isCreator: false,
    ...overrides,
  };
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'contract-1',
    paperTitle: 'Test Paper',
    paperId: 'paper-1',
    status: 'pending_signatures',
    contractHash: null,
    hederaTxId: null,
    createdAt: '2025-01-01',
    contributors: [makeContractContributor()],
    ...overrides,
  };
}

// ===========================================================================
// dashboard.ts
// ===========================================================================

describe('deriveSubmissionDisplayStatus', () => {
  it('returns "Paper Submitted" for submitted', () => {
    expect(deriveSubmissionDisplayStatus('submitted', 0, 0, null, false)).toBe(
      'Paper Submitted',
    );
  });

  it('returns "Viewed By Editor" for viewed_by_editor', () => {
    expect(
      deriveSubmissionDisplayStatus('viewed_by_editor', 0, 0, null, false),
    ).toBe('Viewed By Editor');
  });

  it('returns "Desk Reject" for rejected without reviews', () => {
    expect(deriveSubmissionDisplayStatus('rejected', 0, 0, null, false)).toBe(
      'Desk Reject',
    );
  });

  it('returns "Rejected" for rejected with reviews', () => {
    expect(deriveSubmissionDisplayStatus('rejected', 2, 3, null, true)).toBe(
      'Rejected',
    );
  });

  it('returns "Assigned N Reviewers" for criteria_published', () => {
    expect(
      deriveSubmissionDisplayStatus('criteria_published', 0, 3, null, false),
    ).toBe('Assigned 3 Reviewers');
  });

  it('returns "Assigned 1 Reviewer" (singular) for 1 reviewer', () => {
    expect(
      deriveSubmissionDisplayStatus('reviewers_assigned', 0, 1, null, false),
    ).toBe('Assigned 1 Reviewer');
  });

  it('returns "X/Y Reviews Completed" for under_review', () => {
    expect(
      deriveSubmissionDisplayStatus('under_review', 2, 3, null, false),
    ).toBe('2/3 Reviews Completed');
  });

  it('returns "All Reviews Completed" for reviews_completed without author acceptance', () => {
    expect(
      deriveSubmissionDisplayStatus('reviews_completed', 3, 3, null, false),
    ).toBe('All Reviews Completed');
  });

  it('returns "Reviews Sent to Editor" for reviews_completed with author acceptance', () => {
    expect(
      deriveSubmissionDisplayStatus(
        'reviews_completed',
        3,
        3,
        'accepted',
        false,
      ),
    ).toBe('Reviews Sent to Editor');
  });

  it('returns "Rebuttal Phase" for rebuttal_open', () => {
    expect(
      deriveSubmissionDisplayStatus('rebuttal_open', 0, 0, null, false),
    ).toBe('Rebuttal Phase');
  });

  it('returns "Accepted" for accepted', () => {
    expect(deriveSubmissionDisplayStatus('accepted', 0, 0, null, false)).toBe(
      'Accepted',
    );
  });

  it('returns "Accepted" for published', () => {
    expect(deriveSubmissionDisplayStatus('published', 0, 0, null, false)).toBe(
      'Accepted',
    );
  });

  it('returns "Reviews Sent to Editor" for revision_requested', () => {
    expect(
      deriveSubmissionDisplayStatus('revision_requested', 0, 0, null, false),
    ).toBe('Reviews Sent to Editor');
  });

  it('returns "Paper Submitted" for unknown status', () => {
    expect(
      deriveSubmissionDisplayStatus('unknown_status', 0, 0, null, false),
    ).toBe('Paper Submitted');
  });
});

describe('mapPapersToSubmissionCards', () => {
  it('skips papers without submissions', () => {
    const papers = [makeDbPaper({ submissions: [] })];
    expect(mapPapersToSubmissionCards(papers)).toEqual([]);
  });

  it('maps paper with submission to card', () => {
    const papers = [
      makeDbPaper({
        submissions: [
          {
            id: 'sub-1',
            status: 'submitted',
            submittedAt: '2025-01-10',
            authorResponseStatus: null,
            journal: { name: 'Nature' },
            reviewAssignments: [],
          },
        ],
        contracts: [
          {
            contributors: [
              { contributorName: 'Alice' },
              { contributorName: 'Bob' },
            ],
          },
        ],
      }),
    ];
    const cards = mapPapersToSubmissionCards(papers);
    expect(cards).toHaveLength(1);
    expect(cards[0].paperTitle).toBe('Test Paper');
    expect(cards[0].journalName).toBe('Nature');
    expect(cards[0].authors).toBe('Alice, Bob');
    expect(cards[0].status).toBe('Paper Submitted');
  });

  it('falls back to "—" for missing journal name', () => {
    const papers = [
      makeDbPaper({
        submissions: [
          {
            id: 'sub-1',
            status: 'submitted',
            submittedAt: '2025-01-10',
            authorResponseStatus: null,
            reviewAssignments: [],
          },
        ],
      }),
    ];
    const cards = mapPapersToSubmissionCards(papers);
    expect(cards[0].journalName).toBe('—');
  });

  it('counts completed reviews correctly', () => {
    const papers = [
      makeDbPaper({
        submissions: [
          {
            id: 'sub-1',
            status: 'under_review',
            submittedAt: '2025-01-10',
            authorResponseStatus: null,
            reviewAssignments: [
              { id: 'a1', status: 'submitted' },
              { id: 'a2', status: 'accepted' },
              { id: 'a3', status: 'submitted' },
            ],
          },
        ],
      }),
    ];
    const cards = mapPapersToSubmissionCards(papers);
    expect(cards[0].completedReviewCount).toBe(2);
    expect(cards[0].totalReviewCount).toBe(3);
    expect(cards[0].status).toBe('2/3 Reviews Completed');
  });
});

describe('computeStats', () => {
  it('counts newSubmissions for Paper Submitted and Viewed By Editor', () => {
    const cards = [
      { status: 'Paper Submitted' },
      { status: 'Viewed By Editor' },
      { status: 'Accepted' },
    ] as unknown as Parameters<typeof computeStats>[0];
    expect(computeStats(cards).newSubmissions).toBe(2);
  });

  it('counts underReview for Assigned and partial reviews', () => {
    const cards = [
      { status: 'Assigned 3 Reviewers' },
      { status: '2/3 Reviews Completed' },
    ] as unknown as Parameters<typeof computeStats>[0];
    expect(computeStats(cards).underReview).toBe(2);
  });

  it('does NOT count "All Reviews Completed" as underReview', () => {
    const cards = [{ status: 'All Reviews Completed' }] as Parameters<
      typeof computeStats
    >[0];
    expect(computeStats(cards).underReview).toBe(0);
    expect(computeStats(cards).reviewsPending).toBe(1);
  });

  it('counts accepted', () => {
    const cards = [{ status: 'Accepted' }] as Parameters<
      typeof computeStats
    >[0];
    expect(computeStats(cards).accepted).toBe(1);
  });

  it('counts both Rejected and Desk Reject', () => {
    const cards = [
      { status: 'Rejected' },
      { status: 'Desk Reject' },
    ] as unknown as Parameters<typeof computeStats>[0];
    expect(computeStats(cards).rejected).toBe(2);
  });

  it('returns all zeros for empty array', () => {
    expect(computeStats([])).toEqual({
      newSubmissions: 0,
      underReview: 0,
      reviewsPending: 0,
      accepted: 0,
      rejected: 0,
    });
  });
});

// ===========================================================================
// contract.ts
// ===========================================================================

describe('mapApiContributors', () => {
  it('maps DB contributors to client shape', () => {
    const db = [
      makeContractContributor({
        id: 'cc-1',
        contributorWallet: '0xabc',
        contributionPct: 60,
      }),
    ];
    const result = mapApiContributors(db);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      dbId: 'cc-1',
      wallet: '0xabc',
      pct: 60,
      name: 'Alice',
    });
  });

  it('falls back to "Unknown user" for null name', () => {
    const db = [makeContractContributor({ contributorName: null })];
    expect(mapApiContributors(db)[0].name).toBe('Unknown user');
  });

  it('assigns sequential ids starting from 1', () => {
    const db = [
      makeContractContributor({ id: 'a' }),
      makeContractContributor({ id: 'b' }),
      makeContractContributor({ id: 'c' }),
    ];
    const result = mapApiContributors(db);
    expect(result.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('maps signature to txHash', () => {
    const db = [
      makeContractContributor({ signature: '0xsig', signedAt: '2025-01-01' }),
    ];
    const result = mapApiContributors(db);
    expect(result[0].txHash).toBe('0xsig');
    expect(result[0].signedAt).toBe('2025-01-01');
  });

  it('maps null roleDescription to empty string', () => {
    const db = [makeContractContributor({ roleDescription: null })];
    expect(mapApiContributors(db)[0].role).toBe('');
  });
});

describe('mapApiPapersToDrafts', () => {
  it('includes draft, registered, and contract_pending papers', () => {
    const papers: Paper[] = [
      { id: 'p1', title: 'Draft', status: 'draft' } as Paper,
      { id: 'p2', title: 'Registered', status: 'registered' } as Paper,
      { id: 'p3', title: 'Pending', status: 'contract_pending' } as Paper,
      { id: 'p4', title: 'Submitted', status: 'submitted' } as Paper,
    ];
    const result = mapApiPapersToDrafts(papers, []);
    expect(result).toHaveLength(3);
  });

  it('matches contract by paperId', () => {
    const papers: Paper[] = [
      { id: 'p1', title: 'Draft', status: 'draft' } as Paper,
    ];
    const contracts: Contract[] = [
      makeContract({ id: 'c1', paperId: 'p1', contributors: [] }),
    ];
    const result = mapApiPapersToDrafts(papers, contracts);
    expect(result[0].contractId).toBe('c1');
  });

  it('falls back to matching by title when paperId is null', () => {
    const papers: Paper[] = [
      { id: 'p1', title: 'My Paper', status: 'draft' } as Paper,
    ];
    const contracts: Contract[] = [
      makeContract({
        id: 'c1',
        paperId: null,
        paperTitle: 'My Paper',
        contributors: [],
      }),
    ];
    const result = mapApiPapersToDrafts(papers, contracts);
    expect(result[0].contractId).toBe('c1');
  });

  it('refuses title-only match when multiple papers share the same title', () => {
    const papers: Paper[] = [
      { id: 'p1', title: 'Same Title', status: 'draft' } as Paper,
      { id: 'p2', title: 'Same Title', status: 'draft' } as Paper,
    ];
    const contracts: Contract[] = [
      makeContract({
        id: 'c1',
        paperId: null,
        paperTitle: 'Same Title',
        contributors: [],
      }),
    ];
    const result = mapApiPapersToDrafts(papers, contracts);
    // Neither paper matches — title-only match is skipped when ambiguous
    expect(result[0].contractId).toBeUndefined();
    expect(result[1].contractId).toBeUndefined();
  });

  it('still uses title match when only one paper has that title', () => {
    const papers: Paper[] = [
      { id: 'p1', title: 'Unique Title', status: 'draft' } as Paper,
      { id: 'p2', title: 'Different Title', status: 'draft' } as Paper,
    ];
    const contracts: Contract[] = [
      makeContract({
        id: 'c1',
        paperId: null,
        paperTitle: 'Unique Title',
        contributors: [],
      }),
    ];
    const result = mapApiPapersToDrafts(papers, contracts);
    expect(result[0].contractId).toBe('c1');
    expect(result[1].contractId).toBeUndefined();
  });

  it('sets registered=true for registered and contract_pending status', () => {
    const papers: Paper[] = [
      { id: 'p1', title: 'A', status: 'draft' } as Paper,
      { id: 'p2', title: 'B', status: 'registered' } as Paper,
    ];
    const result = mapApiPapersToDrafts(papers, []);
    expect(result[0].registered).toBe(false);
    expect(result[1].registered).toBe(true);
  });

  it('extracts hash from first version', () => {
    const papers: Paper[] = [
      {
        id: 'p1',
        title: 'A',
        status: 'draft',
        versions: [{ paperHash: 'hash1' }],
      } as unknown as Paper,
    ];
    const result = mapApiPapersToDrafts(papers, []);
    expect(result[0].hash).toBe('hash1');
  });

  it('falls back to "—" when no versions', () => {
    const papers: Paper[] = [
      { id: 'p1', title: 'A', status: 'draft' } as Paper,
    ];
    const result = mapApiPapersToDrafts(papers, []);
    expect(result[0].hash).toBe('—');
  });
});

describe('mapContractsToSign', () => {
  it('excludes contracts where user is the creator', () => {
    const contracts = [
      {
        id: 'c1',
        paperTitle: 'Paper',
        creator: { walletAddress: '0xme' },
        contributors: [makeContractContributor()],
      },
    ] as Parameters<typeof mapContractsToSign>[0];
    expect(mapContractsToSign(contracts, '0xme')).toEqual([]);
  });

  it('includes contracts where user is NOT the creator', () => {
    const contracts = [
      {
        id: 'c1',
        paperTitle: 'Paper',
        creator: { walletAddress: '0xother' },
        contributors: [makeContractContributor()],
      },
    ] as Parameters<typeof mapContractsToSign>[0];
    const result = mapContractsToSign(contracts, '0xme');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
  });
});

describe('mapOwnedContractsForStatus', () => {
  it('counts pending contributors', () => {
    const contracts = [
      makeContract({
        contributors: [
          makeContractContributor({ status: 'pending' }),
          makeContractContributor({ status: 'signed' }),
          makeContractContributor({ status: 'pending' }),
        ],
      }),
    ];
    const result = mapOwnedContractsForStatus(contracts);
    expect(result[0].pendingCount).toBe(2);
  });

  it('sets allSigned when contract status is fully_signed', () => {
    const contracts = [makeContract({ status: 'fully_signed' })];
    expect(mapOwnedContractsForStatus(contracts)[0].allSigned).toBe(true);
  });

  it('sets allSigned=false for pending_signatures', () => {
    const contracts = [makeContract({ status: 'pending_signatures' })];
    expect(mapOwnedContractsForStatus(contracts)[0].allSigned).toBe(false);
  });
});

describe('mapDbContractToSigned', () => {
  it('flattens to SignedContract shape', () => {
    const contract = makeContract({
      contractHash: '0xhash',
      contributors: [
        makeContractContributor({
          contributorName: 'Alice',
          contributionPct: 60,
        }),
        makeContractContributor({
          contributorName: 'Bob',
          contributionPct: 40,
        }),
      ],
    });
    const result = mapDbContractToSigned(contract);
    expect(result.id).toBe('contract-1');
    expect(result.title).toBe('Test Paper');
    expect(result.hash).toBe('0xhash');
    expect(result.contributors).toBe('Alice (60%), Bob (40%)');
  });

  it('uses "—" for null contractHash', () => {
    const contract = makeContract({ contractHash: null });
    expect(mapDbContractToSigned(contract).hash).toBe('—');
  });

  it('uses "Unknown" for null contributor name', () => {
    const contract = makeContract({
      contributors: [
        makeContractContributor({
          contributorName: null,
          contributionPct: 100,
        }),
      ],
    });
    expect(mapDbContractToSigned(contract).contributors).toBe('Unknown (100%)');
  });

  it('uses "—" when contributors list is empty', () => {
    const contract = makeContract({ contributors: [] });
    expect(mapDbContractToSigned(contract).contributors).toBe('—');
  });
});

// ===========================================================================
// review.ts
// ===========================================================================

describe('anonymizeReviews', () => {
  it('strips identity and assigns sequential labels', () => {
    const reviews = [
      {
        id: 'r1',
        criteriaEvaluations: null,
        strengths: 'good',
        weaknesses: null,
        questionsForAuthors: null,
        recommendation: 'accept',
      },
      {
        id: 'r2',
        criteriaEvaluations: null,
        strengths: 'ok',
        weaknesses: 'bad',
        questionsForAuthors: null,
        recommendation: 'reject',
      },
    ];
    const result = anonymizeReviews(reviews);
    expect(result[0].label).toBe('Reviewer A');
    expect(result[1].label).toBe('Reviewer B');
    expect(result[0].strengths).toBe('good');
    expect(result[1].weaknesses).toBe('bad');
  });

  it('normalizes Date submittedAt to ISO string', () => {
    const date = new Date('2025-06-15T10:00:00Z');
    const reviews = [
      {
        id: 'r1',
        criteriaEvaluations: null,
        strengths: null,
        weaknesses: null,
        questionsForAuthors: null,
        recommendation: null,
        submittedAt: date,
      },
    ];
    const result = anonymizeReviews(reviews);
    expect(result[0].submittedAt).toBe(date.toISOString());
  });

  it('passes through string submittedAt unchanged', () => {
    const reviews = [
      {
        id: 'r1',
        criteriaEvaluations: null,
        strengths: null,
        weaknesses: null,
        questionsForAuthors: null,
        recommendation: null,
        submittedAt: '2025-06-15',
      },
    ];
    expect(anonymizeReviews(reviews)[0].submittedAt).toBe('2025-06-15');
  });

  it('returns undefined for null/missing submittedAt', () => {
    const reviews = [
      {
        id: 'r1',
        criteriaEvaluations: null,
        strengths: null,
        weaknesses: null,
        questionsForAuthors: null,
        recommendation: null,
        submittedAt: null,
      },
    ];
    expect(anonymizeReviews(reviews)[0].submittedAt).toBeUndefined();
  });

  it('handles empty array', () => {
    expect(anonymizeReviews([])).toEqual([]);
  });

  it('labels third reviewer as "Reviewer C"', () => {
    const reviews = Array.from({ length: 3 }, (_, i) => ({
      id: `r${i}`,
      criteriaEvaluations: null,
      strengths: null,
      weaknesses: null,
      questionsForAuthors: null,
      recommendation: null,
    }));
    expect(anonymizeReviews(reviews)[2].label).toBe('Reviewer C');
  });
});

// ===========================================================================
// paper-utils.ts
// ===========================================================================

describe('extractAuthors', () => {
  it('extracts comma-separated author names from contracts', () => {
    const paper = makeDbPaper({
      contracts: [
        {
          contributors: [
            { contributorName: 'Alice' },
            { contributorName: 'Bob' },
          ],
        },
      ],
    });
    expect(extractAuthors(paper)).toBe('Alice, Bob');
  });

  it('returns "—" when no contracts', () => {
    const paper = makeDbPaper({ contracts: [] });
    expect(extractAuthors(paper)).toBe('—');
  });

  it('returns "—" when contracts is undefined', () => {
    const paper = makeDbPaper({ contracts: undefined });
    expect(extractAuthors(paper)).toBe('—');
  });

  it('filters out null contributor names', () => {
    const paper = makeDbPaper({
      contracts: [
        {
          contributors: [
            { contributorName: 'Alice' },
            { contributorName: null },
          ],
        },
      ],
    });
    expect(extractAuthors(paper)).toBe('Alice');
  });

  it('returns "—" when all names are null', () => {
    const paper = makeDbPaper({
      contracts: [{ contributors: [{ contributorName: null }] }],
    });
    expect(extractAuthors(paper)).toBe('—');
  });

  it('flattens contributors across multiple contracts', () => {
    const paper = makeDbPaper({
      contracts: [
        { contributors: [{ contributorName: 'Alice' }] },
        { contributors: [{ contributorName: 'Bob' }] },
      ],
    });
    expect(extractAuthors(paper)).toBe('Alice, Bob');
  });
});

// ===========================================================================
// submissions.ts
// ===========================================================================

describe('buildSubmissionViewData', () => {
  const basePaper = makeDbPaper({
    submissions: [
      { id: 'sub-1', status: 'under_review', authorResponseStatus: null },
    ],
    contracts: [{ contributors: [{ contributorName: 'Alice' }] }],
  });

  it('returns flat array of submission view objects', () => {
    const result = buildSubmissionViewData(
      [basePaper],
      [{ id: 'a1', submissionId: 'sub-1', status: 'submitted' }],
      [
        {
          id: 'rev-1',
          submissionId: 'sub-1',
          assignmentId: 'a1',
          criteriaEvaluations: null,
          strengths: 'good',
          weaknesses: null,
          questionsForAuthors: null,
          recommendation: 'accept',
        },
      ],
    );
    expect(result).toHaveLength(1);
    expect(result[0].paperTitle).toBe('Test Paper');
    expect(result[0].authors).toBe('Alice');
    expect(result[0].reviewers).toHaveLength(1);
    expect(result[0].reviewers[0].label).toBe('Reviewer A');
    expect(result[0].reviewers[0].status).toBe('complete');
  });

  it('labels reviewers sequentially A, B, C', () => {
    const result = buildSubmissionViewData(
      [basePaper],
      [
        { id: 'a1', submissionId: 'sub-1', status: 'submitted' },
        { id: 'a2', submissionId: 'sub-1', status: 'accepted' },
        { id: 'a3', submissionId: 'sub-1', status: 'submitted' },
      ],
      [],
    );
    expect(result[0].reviewers.map((r) => r.label)).toEqual([
      'Reviewer A',
      'Reviewer B',
      'Reviewer C',
    ]);
  });

  it('sets allReviewsComplete when all assignments are submitted', () => {
    const result = buildSubmissionViewData(
      [basePaper],
      [
        { id: 'a1', submissionId: 'sub-1', status: 'submitted' },
        { id: 'a2', submissionId: 'sub-1', status: 'submitted' },
      ],
      [],
    );
    expect(result[0].allReviewsComplete).toBe(true);
  });

  it('sets allReviewsComplete=false when some assignments not submitted', () => {
    const result = buildSubmissionViewData(
      [basePaper],
      [
        { id: 'a1', submissionId: 'sub-1', status: 'submitted' },
        { id: 'a2', submissionId: 'sub-1', status: 'accepted' },
      ],
      [],
    );
    expect(result[0].allReviewsComplete).toBe(false);
  });

  it('sets allReviewsComplete when status is reviews_completed', () => {
    const paper = makeDbPaper({
      submissions: [
        {
          id: 'sub-1',
          status: 'reviews_completed',
          authorResponseStatus: null,
        },
      ],
    });
    const result = buildSubmissionViewData([paper], [], []);
    expect(result[0].allReviewsComplete).toBe(true);
  });

  it('anonymizes reviews in output', () => {
    const result = buildSubmissionViewData(
      [basePaper],
      [{ id: 'a1', submissionId: 'sub-1', status: 'submitted' }],
      [
        {
          id: 'rev-1',
          submissionId: 'sub-1',
          assignmentId: 'a1',
          criteriaEvaluations: null,
          strengths: 'good',
          weaknesses: null,
          questionsForAuthors: null,
          recommendation: 'accept',
        },
      ],
    );
    expect(result[0].reviews[0].label).toBe('Reviewer A');
    expect(result[0].reviews[0].strengths).toBe('good');
  });

  it('handles papers with no submissions', () => {
    const paper = makeDbPaper({ submissions: [] });
    expect(buildSubmissionViewData([paper], [], [])).toEqual([]);
  });

  it('links reviewId from review to assignment', () => {
    const result = buildSubmissionViewData(
      [basePaper],
      [{ id: 'a1', submissionId: 'sub-1', status: 'submitted' }],
      [
        {
          id: 'rev-1',
          submissionId: 'sub-1',
          assignmentId: 'a1',
          criteriaEvaluations: null,
          strengths: null,
          weaknesses: null,
          questionsForAuthors: null,
          recommendation: null,
        },
      ],
    );
    expect(result[0].reviewers[0].reviewId).toBe('rev-1');
  });
});
