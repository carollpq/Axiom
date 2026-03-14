import type { DbPaperWithRelations } from '@/src/features/papers/queries';
import { deriveSubmissionDisplayStatus } from '@/src/features/researcher/lib/dashboard';
import { anonymizeReviews } from '@/src/features/researcher/lib/review';
import { extractAuthors } from '@/src/features/researcher/lib/paper-utils';

/**
 * Aggregates papers, review assignments, and reviews into the shape
 * consumed by ViewSubmissionsClient.
 */
export function buildSubmissionViewData(
  papers: DbPaperWithRelations[],
  assignmentRows: readonly {
    id: string;
    submissionId: string;
    status: string;
  }[],
  reviewRows: readonly {
    id: string;
    submissionId: string;
    assignmentId: string;
    criteriaEvaluations: string | null;
    strengths: string | null;
    weaknesses: string | null;
    questionsForAuthors: string | null;
    recommendation: string | null;
  }[],
) {
  // Index by submissionId for O(1) lookups instead of O(n) filters per submission
  const assignmentsBySubId = Map.groupBy(assignmentRows, (a) => a.submissionId);
  const reviewsBySubId = Map.groupBy(reviewRows, (r) => r.submissionId);
  const reviewByAssignmentId = new Map(
    reviewRows.map((r) => [r.assignmentId, r.id]),
  );

  return papers.flatMap((paper) => {
    const authors = extractAuthors(paper);

    return (paper.submissions ?? []).map((sub) => {
      const subAssignments = assignmentsBySubId.get(sub.id) ?? [];
      const subReviews = reviewsBySubId.get(sub.id) ?? [];

      const completedCount = subAssignments.filter(
        (a) => a.status === 'submitted',
      ).length;

      const reviewers = subAssignments.map((a, i) => ({
        assignmentId: a.id,
        label: `Reviewer ${String.fromCharCode(65 + i)}`,
        status: (a.status === 'submitted' ? 'complete' : 'in_progress') as
          | 'complete'
          | 'in_progress',
        reviewId: reviewByAssignmentId.get(a.id),
      }));

      const status = deriveSubmissionDisplayStatus(
        sub.status,
        completedCount,
        subAssignments.length,
        sub.authorResponseStatus,
        subReviews.length > 0,
      );

      return {
        id: sub.id,
        paperTitle: paper.title,
        authors,
        abstract: paper.abstract ?? '',
        status,
        reviewers,
        reviews: anonymizeReviews(subReviews),
        allReviewsComplete:
          sub.status === 'reviews_completed' ||
          (subAssignments.length > 0 &&
            completedCount === subAssignments.length),
        authorResponseStatus: sub.authorResponseStatus,
      };
    });
  });
}
