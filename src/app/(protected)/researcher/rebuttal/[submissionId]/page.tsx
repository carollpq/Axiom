import { getSession } from '@/src/shared/lib/auth/auth';
import { getRebuttalBySubmission } from '@/src/features/rebuttals/queries';
import { listReviewsForSubmission } from '@/src/features/reviews/queries';
import { RebuttalWorkspace } from '@/src/features/rebuttals/components/rebuttal-workspace.client';
import { anonymizeReviews } from '@/src/features/researcher/lib/review';
import { PageContainer } from '@/src/shared/components/page-container';

export default async function RebuttalPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  await getSession(); // Auth guard

  const { submissionId } = await params;

  const [rebuttal, reviews] = await Promise.all([
    getRebuttalBySubmission(submissionId),
    listReviewsForSubmission(submissionId),
  ]);

  if (!rebuttal) {
    return (
      <PageContainer className="py-16 text-center">
        <h1 className="text-[22px] text-[#e8e0d4] font-serif mb-2">
          No Rebuttal Found
        </h1>
        <p className="text-[13px] text-[#6a6050] font-serif">
          There is no active rebuttal phase for this submission.
        </p>
      </PageContainer>
    );
  }

  // Anonymize reviews (exclude confidential comments)
  const anonymizedReviews = anonymizeReviews(reviews).map((r) => ({
    ...r,
    anonymousLabel: r.label,
  }));

  const existingResponses = rebuttal.responses.map((r) => ({
    reviewId: r.reviewId,
    position: r.position,
    justification: r.justification,
  }));

  return (
    <PageContainer>
      <div className="mb-4">
        <h1 className="text-[22px] text-[#e8e0d4] font-serif">
          Rebuttal Response
        </h1>
        <p className="text-[12px] text-[#6a6050] font-serif italic mt-1">
          Review the feedback and respond to each reviewer
        </p>
      </div>
      <RebuttalWorkspace
        rebuttalId={rebuttal.id}
        rebuttalStatus={rebuttal.status}
        deadline={rebuttal.deadline}
        reviews={anonymizedReviews}
        existingResponses={existingResponses}
        resolution={rebuttal.resolution}
        editorNotes={rebuttal.editorNotes}
      />
    </PageContainer>
  );
}
