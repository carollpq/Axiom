import { redirect } from "next/navigation";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getReviewAssignment } from "@/src/features/reviews/queries";
import { ReviewWorkspaceClient } from "@/src/features/reviewer/review-workspace/ReviewWorkspaceClient";

export default async function ReviewWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const wallet = (await getSession())!;

  const { id: assignmentId } = await params;
  const assignment = await getReviewAssignment(assignmentId, wallet);

  if (!assignment) {
    redirect("/reviewer");
  }

  return (
    <ReviewWorkspaceClient
      assignment={assignment}
    />
  );
}
