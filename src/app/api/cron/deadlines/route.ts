import { NextRequest, NextResponse } from "next/server";
import { listOverdueAssignments } from "@/src/features/reviews/queries";
import { markAssignmentLate, createReputationEvent } from "@/src/features/reviews/actions";
import { createNotification } from "@/src/features/notifications/actions";
import { mintReputationToken } from "@/src/shared/lib/hedera/hts";

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

    const mintResult = await mintReputationToken(assignment.reviewerWallet, {
      type: "review_late",
      assignmentId: assignment.id,
      submissionId: assignment.submissionId,
    });

    await createReputationEvent({
      userWallet: assignment.reviewerWallet,
      eventType: "review_late",
      scoreDelta: -2,
      details: `Late review for submission ${assignment.submissionId}`,
      htsTokenSerial: mintResult?.serial,
      hederaTxId: mintResult?.txId,
    });

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
