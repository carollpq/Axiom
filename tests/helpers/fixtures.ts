/**
 * Reusable test fixtures.
 */

export const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
export const TEST_WALLET_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
export const TEST_EDITOR_WALLET = '0xededed1234567890ededed1234567890ededed12';

export const TEST_SUBMISSION = {
  id: 'sub-001',
  paperId: 'paper-001',
  journalId: 'journal-001',
  status: 'under_review' as const,
  submittedBy: TEST_WALLET,
  submittedAt: '2025-01-15T10:00:00Z',
};

export const TEST_ASSIGNMENT = {
  id: 'assign-001',
  submissionId: 'sub-001',
  reviewerWallet: TEST_WALLET_2,
  status: 'accepted' as const,
  assignedAt: '2025-01-16T10:00:00Z',
  deadline: '2025-02-06T10:00:00Z',
};

export const TEST_REVIEWER_STATS = {
  base: { reviewCount: 0, overallScore: 50, timelinessScore: 50 },
  firstReview: { reviewCount: 1, overallScore: 55, timelinessScore: 70 },
  fiveReviews: { reviewCount: 5, overallScore: 65, timelinessScore: 80 },
  tenReviews: { reviewCount: 10, overallScore: 72, timelinessScore: 85 },
  twentyfiveReviews: { reviewCount: 25, overallScore: 78, timelinessScore: 88 },
  highReputation: { reviewCount: 15, overallScore: 85, timelinessScore: 75 },
  timelyReviewer: { reviewCount: 8, overallScore: 60, timelinessScore: 95 },
  allBadges: { reviewCount: 25, overallScore: 85, timelinessScore: 95 },
};

export const TEST_BADGE = {
  id: 'badge-001',
  userWallet: TEST_WALLET_2,
  badgeType: 'first_review' as const,
  achievementName: 'First Review Completed',
  metadata: {
    description: 'Completed your first peer review on Axiom.',
    reviewCount: 1,
    overallScore: 55,
    timelinessScore: 70,
  },
  issuedAt: '2025-01-20T12:00:00Z',
};
