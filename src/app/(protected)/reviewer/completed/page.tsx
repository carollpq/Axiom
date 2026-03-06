import { getSession } from "@/src/shared/lib/auth/auth";
import { listCompletedReviewsExtended } from "@/src/features/reviewer/queries";
import { mapDbToCompletedReviewExtended } from "@/src/features/reviewer/mappers/reviewer";
import { CompletedPapersClient } from "@/src/features/reviewer/reviewer-dashboard/reviewer-dashboard.client";

export default async function CompletedPapersPage() {
  const wallet = (await getSession())!;
  const rawCompleted = await listCompletedReviewsExtended(wallet);

  return (
    <CompletedPapersClient initialCompleted={rawCompleted.map(mapDbToCompletedReviewExtended)} />
  );
}
