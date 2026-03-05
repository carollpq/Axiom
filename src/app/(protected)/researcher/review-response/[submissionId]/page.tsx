import { getSession } from "@/src/shared/lib/auth/auth";
import { db } from "@/src/shared/lib/db";
import { submissions, users } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { listReviewsForSubmission, getPublishedCriteria } from "@/src/features/reviews/queries";
import { ReviewResponseClient } from "@/src/features/researcher/components/review-response/review-response.client";

export default async function ReviewResponsePage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const wallet = (await getSession())!;
  const { submissionId } = await params;

  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      paper: { with: { owner: true } },
      journal: true,
    },
  });

  if (!submission) redirect("/researcher");

  // Verify ownership
  const user = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, wallet.toLowerCase()))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (!user || submission.paper.ownerId !== user.id) redirect("/researcher");

  // Only allow access if reviews are completed
  if (submission.status !== "reviews_completed") redirect("/researcher");

  const [reviews, criteria] = await Promise.all([
    listReviewsForSubmission(submissionId),
    getPublishedCriteria(submissionId),
  ]);

  // Anonymize reviews (strip wallet, add labels)
  const anonymizedReviews = reviews.map((r, idx) => ({
    id: r.id,
    label: `Reviewer ${String.fromCharCode(65 + idx)}`,
    criteriaEvaluations: r.criteriaEvaluations,
    strengths: r.strengths,
    weaknesses: r.weaknesses,
    questionsForAuthors: r.questionsForAuthors,
    recommendation: r.recommendation,
    submittedAt: r.submittedAt,
  }));

  const criteriaList = criteria?.criteriaJson
    ? JSON.parse(criteria.criteriaJson)
    : [];

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <ReviewResponseClient
        submissionId={submissionId}
        paperTitle={submission.paper.title}
        journalName={submission.journal.name}
        reviews={anonymizedReviews}
        criteria={criteriaList}
      />
    </div>
  );
}
