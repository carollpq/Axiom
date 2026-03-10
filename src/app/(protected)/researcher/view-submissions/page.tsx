import { getSession } from '@/src/shared/lib/auth/auth';
import { listUserPapers } from '@/src/features/papers/queries';
import { db } from '@/src/shared/lib/db';
import { reviewAssignments, reviews } from '@/src/shared/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { ViewSubmissionsClient } from '@/src/features/researcher/components/view-submissions/view-submissions.client';
import { deriveSubmissionDisplayStatus } from '@/src/features/researcher/mappers/dashboard';

export default async function ViewSubmissionsPage() {
  const wallet = (await getSession())!;
  const papers = await listUserPapers(wallet);

  // Collect all submission IDs from user's papers
  const allSubmissionIds = papers
    .flatMap((p) => p.submissions ?? [])
    .map((s) => s.id);

  if (allSubmissionIds.length === 0) {
    return <ViewSubmissionsClient submissions={[]} />;
  }

  // Fetch assignments and reviews for all submissions
  const [assignmentRows, reviewRows] = await Promise.all([
    db
      .select()
      .from(reviewAssignments)
      .where(inArray(reviewAssignments.submissionId, allSubmissionIds)),
    db
      .select()
      .from(reviews)
      .where(inArray(reviews.submissionId, allSubmissionIds)),
  ]);

  // Build submissions data
  const submissionsData = papers.flatMap((paper) => {
    const authors =
      paper.contracts
        ?.flatMap((c) => c.contributors ?? [])
        .map((c) => c.contributorName)
        .filter(Boolean)
        .join(', ') || '\u2014';

    return (paper.submissions ?? []).map((sub, _idx) => {
      const subAssignments = assignmentRows.filter(
        (a) => a.submissionId === sub.id,
      );
      const subReviews = reviewRows.filter((r) => r.submissionId === sub.id);

      const completedCount = subAssignments.filter(
        (a) => a.status === 'submitted',
      ).length;

      const reviewers = subAssignments.map((a, i) => ({
        assignmentId: a.id,
        label: `Reviewer ${String.fromCharCode(65 + i)}`,
        status: (a.status === 'submitted' ? 'complete' : 'in_progress') as
          | 'complete'
          | 'in_progress',
        reviewId: subReviews.find((r) => r.assignmentId === a.id)?.id,
      }));

      const anonymizedReviews = subReviews.map((r, i) => ({
        id: r.id,
        label: `Reviewer ${String.fromCharCode(65 + i)}`,
        criteriaEvaluations: r.criteriaEvaluations,
        strengths: r.strengths,
        weaknesses: r.weaknesses,
        questionsForAuthors: r.questionsForAuthors,
        recommendation: r.recommendation,
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
        reviews: anonymizedReviews,
        allReviewsComplete:
          sub.status === 'reviews_completed' ||
          (subAssignments.length > 0 &&
            completedCount === subAssignments.length &&
            subAssignments.length > 0),
        authorResponseStatus: sub.authorResponseStatus,
      };
    });
  });

  return <ViewSubmissionsClient submissions={submissionsData} />;
}
