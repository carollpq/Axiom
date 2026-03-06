import { getSession } from "@/src/shared/lib/auth/auth";
import { listAssignedReviews } from "@/src/features/reviewer/queries";
import { mapDbToAssignedReviewExtended } from "@/src/features/reviewer/mappers/dashboard";
import { IncomingInvitesClient } from "@/src/features/reviewer/components/invites/incoming-invites.client";

export default async function IncomingInvitesPage() {
  const wallet = (await getSession())!;
  const rawAssigned = await listAssignedReviews(wallet);

  return (
    <IncomingInvitesClient
      extendedInvites={rawAssigned.map(mapDbToAssignedReviewExtended)}
    />
  );
}
