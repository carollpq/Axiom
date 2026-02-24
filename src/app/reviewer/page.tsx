import { redirect } from "next/navigation";
import { getSession } from "@/src/shared/lib/auth/auth";
import { listAssignedReviews, listCompletedReviews } from "@/src/features/reviewer/queries";
import { mapDbToAssignedReview, mapDbToCompletedReview } from "@/src/features/reviewer/mappers/reviewer";
import { ReviewerDashboardClient } from "@/src/features/reviewer/reviewer-dashboard/reviewer-dashboard.client";

export default async function ReviewerDashboard() {
  const wallet = await getSession();
  if (!wallet) redirect("/login");

  const [rawAssigned, rawCompleted] = await Promise.all([
    listAssignedReviews(wallet),
    listCompletedReviews(wallet),
  ]);

  return (
    <ReviewerDashboardClient
      initialAssigned={rawAssigned.map(mapDbToAssignedReview)}
      initialCompleted={rawCompleted.map(mapDbToCompletedReview)}
    />
  );
}
