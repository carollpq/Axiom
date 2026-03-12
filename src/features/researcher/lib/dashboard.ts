import type {
  SubmissionCard,
  SubmissionDisplayStatus,
  DashboardStats,
} from '@/src/features/researcher/types/dashboard';
import type { DbPaperWithRelations } from '@/src/features/papers/queries';
import { formatDate } from '@/src/shared/lib/format';
import { extractAuthors } from '@/src/features/researcher/lib/paper-utils';

/**
 * Derives a user-friendly submission status from the DB submission status,
 * review counts, and author response.
 */
export function deriveSubmissionDisplayStatus(
  dbStatus: string,
  completedReviewCount: number,
  totalReviewCount: number,
  authorResponseStatus: string | null,
  hasReviews: boolean,
): SubmissionDisplayStatus {
  switch (dbStatus) {
    case 'submitted':
      return 'Paper Submitted';
    case 'viewed_by_editor':
      return 'Viewed By Editor';
    case 'rejected':
      return hasReviews ? 'Rejected' : 'Desk Reject';
    case 'criteria_published':
    case 'reviewers_assigned':
      return `Assigned ${totalReviewCount} Reviewer${totalReviewCount !== 1 ? 's' : ''}`;
    case 'under_review':
      return `${completedReviewCount}/${totalReviewCount} Reviews Completed`;
    case 'reviews_completed':
      if (authorResponseStatus === 'accepted') return 'Reviews Sent to Editor';
      return 'All Reviews Completed';
    case 'rebuttal_open':
      return 'Rebuttal Phase';
    case 'accepted':
    case 'published':
      return 'Accepted';
    case 'revision_requested':
      return 'Reviews Sent to Editor';
    default:
      return 'Paper Submitted';
  }
}

/**
 * Maps DB papers (with submissions) to SubmissionCard objects for the dashboard.
 * Only papers with at least one submission are included.
 */
export function mapPapersToSubmissionCards(
  papers: DbPaperWithRelations[],
): SubmissionCard[] {
  const cards: SubmissionCard[] = [];

  for (const p of papers) {
    if (!p.submissions || p.submissions.length === 0) continue;

    const authors = extractAuthors(p);

    for (const sub of p.submissions) {
      // These relations are included by the enriched listUserPapers query
      const subAny = sub as typeof sub & {
        journal?: { name: string };
        reviewAssignments?: { id: string; status: string }[];
      };
      const assignments = subAny.reviewAssignments ?? [];
      const totalReviewCount = assignments.length;
      const completedReviewCount = assignments.filter(
        (a) => a.status === 'submitted',
      ).length;

      const status = deriveSubmissionDisplayStatus(
        sub.status,
        completedReviewCount,
        totalReviewCount,
        sub.authorResponseStatus,
        completedReviewCount > 0,
      );

      cards.push({
        id: sub.id,
        paperId: p.id,
        paperTitle: p.title,
        journalName: subAny.journal?.name ?? '\u2014',
        authors,
        submittedAt: formatDate(sub.submittedAt),
        status,
        reviewerCount: totalReviewCount,
        completedReviewCount,
        totalReviewCount,
      });
    }
  }

  return cards;
}

/**
 * Computes the 5 dashboard stats from submission cards.
 * Uses pattern matching since statuses are now dynamic strings.
 */
export function computeStats(cards: SubmissionCard[]): DashboardStats {
  return {
    newSubmissions: cards.filter(
      (c) => c.status === 'Paper Submitted' || c.status === 'Viewed By Editor',
    ).length,
    underReview: cards.filter(
      (c) =>
        c.status.startsWith('Assigned') ||
        (c.status.includes('Reviews Completed') && !c.status.startsWith('All')),
    ).length,
    reviewsPending: cards.filter((c) => c.status === 'All Reviews Completed')
      .length,
    accepted: cards.filter((c) => c.status === 'Accepted').length,
    rejected: cards.filter(
      (c) => c.status === 'Rejected' || c.status === 'Desk Reject',
    ).length,
  };
}
