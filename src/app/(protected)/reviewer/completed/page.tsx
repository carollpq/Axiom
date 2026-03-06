import { getSession } from "@/src/shared/lib/auth/auth";
import { listCompletedReviewsExtended } from "@/src/features/reviewer/queries";
import { mapDbToCompletedReviewExtended } from "@/src/features/reviewer/mappers/dashboard";
import { CompletedPapersClient } from "@/src/features/reviewer/components/completed/completed-papers.client";

export default async function CompletedPapersPage() {
  const wallet = (await getSession())!;
  const rawCompleted = await listCompletedReviewsExtended(wallet);

  return (
    <CompletedPapersClient initialCompleted={rawCompleted.map(mapDbToCompletedReviewExtended)} />
  );
}
