import { db } from "@/src/shared/lib/db";
import { submissions, papers } from "@/src/shared/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getUserByWallet } from "@/src/features/users/queries";

/**
 * Find submissions in `reviews_completed` status where the given wallet owns the paper.
 * Used for pending actions on the researcher dashboard.
 */
export async function listReviewsCompletedSubmissionsForAuthor(walletAddress: string) {
  const user = await getUserByWallet(walletAddress);
  if (!user) return [];

  return db.query.submissions.findMany({
    where: and(
      eq(submissions.status, "reviews_completed"),
      isNull(submissions.authorResponseStatus),
    ),
    with: {
      paper: {
        columns: { id: true, title: true, ownerId: true },
      },
    },
  }).then(subs =>
    subs
      .filter((s) => s.paper.ownerId === user.id)
      .map((s) => ({
        submissionId: s.id,
        paperTitle: s.paper.title,
        submittedAt: s.submittedAt,
      }))
  );
}
