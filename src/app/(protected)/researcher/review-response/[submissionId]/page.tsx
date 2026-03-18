import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserByWallet } from '@/src/features/users/queries';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/src/shared/lib/routes';
import {
  listReviewsForSubmission,
  getPublishedCriteria,
  getSubmissionWithPaperAndJournal,
  getRatedReviewIdsBySubmissionIds,
} from '@/src/features/reviews/queries';
import { ReviewResponseClient } from '@/src/features/researcher/components/review-response/review-response.client';
import { anonymizeReviews } from '@/src/features/researcher/lib/review';
import { PageContainer } from '@/src/shared/components/page-container';

export default async function ReviewResponsePage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const wallet = (await getSession())!;
  const { submissionId } = await params;

  const [submission, user] = await Promise.all([
    getSubmissionWithPaperAndJournal(submissionId),
    getUserByWallet(wallet),
  ]);

  if (!submission) redirect(ROUTES.researcher.root);
  if (!user || submission.paper.ownerId !== user.id)
    redirect(ROUTES.researcher.root);
  if (submission.status !== 'reviews_completed')
    redirect(ROUTES.researcher.root);

  const [reviews, criteria, ratedReviewIds] = await Promise.all([
    listReviewsForSubmission(submissionId),
    getPublishedCriteria(submissionId),
    getRatedReviewIdsBySubmissionIds([submissionId]),
  ]);

  const anonymizedReviews = anonymizeReviews(reviews);

  const criteriaList = criteria?.criteriaJson
    ? JSON.parse(criteria.criteriaJson)
    : [];

  return (
    <PageContainer>
      <ReviewResponseClient
        submissionId={submissionId}
        paperTitle={submission.paper.title}
        journalName={submission.journal.name}
        reviews={anonymizedReviews}
        ratedReviewIds={ratedReviewIds}
        criteria={criteriaList}
      />
    </PageContainer>
  );
}
