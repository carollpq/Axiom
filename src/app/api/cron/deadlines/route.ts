import { NextRequest, NextResponse } from "next/server";
import { listOverdueAssignments } from "@/src/features/reviews/queries";
import { markAssignmentLate } from "@/src/features/reviews/actions";
import { createNotification } from "@/src/features/notifications/actions";
import { recordReputation } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const overdue = await listOverdueAssignments();
  let processed = 0;

  for (const assignment of overdue) {
    await markAssignmentLate(assignment.id);

    await recordReputation(
      assignment.reviewerWallet,
      "review_late",
      -2,
      `Late review for submission ${assignment.submissionId}`,
      { type: "review_late", assignmentId: assignment.id, submissionId: assignment.submissionId },
    );

    // Notify reviewer
    await createNotification({
      userWallet: assignment.reviewerWallet,
      type: "review_late",
      title: "Review overdue",
      body: `Your review for "${assignment.submission.paper.title}" is past deadline.`,
      link: `/reviewer`,
    });

    // Notify editor
    if (assignment.submission.journal?.editorWallet) {
      await createNotification({
        userWallet: assignment.submission.journal.editorWallet,
        type: "review_late",
        title: "Reviewer overdue",
        body: `A reviewer is past deadline for "${assignment.submission.paper.title}".`,
        link: `/editor/under-review`,
      });
    }

    processed++;
  }

  return NextResponse.json({ processed });
}
