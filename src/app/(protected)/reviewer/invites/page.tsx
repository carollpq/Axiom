import { getSession } from "@/src/shared/lib/auth/auth";
import { listAssignedReviews } from "@/src/features/reviewer/queries";
import { mapDbToAssignedReview } from "@/src/features/reviewer/mappers/reviewer";
import { IncomingInvitesClient } from "@/src/features/reviewer/reviewer-dashboard/reviewer-dashboard.client";

export default async function IncomingInvitesPage() {
  const wallet = (await getSession())!;
  const rawAssigned = await listAssignedReviews(wallet);

  return (
    <IncomingInvitesClient initialAssigned={rawAssigned.map(mapDbToAssignedReview)} />
  );
}
