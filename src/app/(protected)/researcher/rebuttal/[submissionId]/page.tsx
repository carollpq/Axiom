import { getSession } from "@/src/shared/lib/auth/auth";
import { getRebuttalBySubmission } from "@/src/features/rebuttals/queries";
import { listReviewsForSubmission } from "@/src/features/reviews/queries";
import { RebuttalWorkspace } from "@/src/features/rebuttals/components/RebuttalWorkspace.client";
import { redirect } from "next/navigation";

export default async function RebuttalPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const wallet = await getSession();
  if (!wallet) redirect("/login");

  const { submissionId } = await params;

  const [rebuttal, reviews] = await Promise.all([
    getRebuttalBySubmission(submissionId),
    listReviewsForSubmission(submissionId),
  ]);

  if (!rebuttal) {
    return (
      <div className="max-w-[600px] mx-auto px-10 py-16 text-center">
        <h1 className="text-[22px] text-[#e8e0d4] font-serif mb-2">
          No Rebuttal Found
        </h1>
        <p className="text-[13px] text-[#6a6050] font-serif">
          There is no active rebuttal phase for this submission.
        </p>
      </div>
    );
  }

  // Map reviews to anonymized format (exclude confidential comments)
  const anonymizedReviews = reviews.map((r, idx) => ({
    id: r.id,
    anonymousLabel: `Reviewer ${String.fromCharCode(65 + idx)}`,
    criteriaEvaluations: r.criteriaEvaluations,
    strengths: r.strengths,
    weaknesses: r.weaknesses,
    questionsForAuthors: r.questionsForAuthors,
    recommendation: r.recommendation,
    // confidentialEditorComments intentionally excluded
  }));

  const existingResponses = rebuttal.responses.map((r) => ({
    reviewId: r.reviewId,
    position: r.position,
    justification: r.justification,
  }));

  return (
    <div className="px-6 py-4">
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
    </div>
  );
}
