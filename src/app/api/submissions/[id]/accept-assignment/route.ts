import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/shared/lib/db";
import { reviewAssignments } from "@/src/shared/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateSubmissionStatus } from "@/src/features/reviews/actions";
import { listReviewAssignmentsForSubmission } from "@/src/features/reviews/queries";
import {
  requireSession,
  anchorAndNotify,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: submissionId } = await params;
  const body = (await req.json()) as { action: "accept" | "decline" };

  if (!body.action || !["accept", "decline"].includes(body.action)) {
    return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
  }

  // Find reviewer's assignment with submission+paper+journal in one query
  const assignment = await db.query.reviewAssignments.findFirst({
    where: and(
      eq(reviewAssignments.submissionId, submissionId),
      eq(reviewAssignments.reviewerWallet, session.toLowerCase()),
      eq(reviewAssignments.status, "assigned"),
    ),
    with: { submission: { with: { paper: { with: { owner: true } }, journal: true } } },
  });

  if (!assignment) {
    return NextResponse.json({ error: "No pending assignment found" }, { status: 404 });
  }

  const submission = assignment.submission;

  if (body.action === "decline") {
    await db
      .update(reviewAssignments)
      .set({ status: "declined" })
      .where(eq(reviewAssignments.id, assignment.id));

    const editorWallet = submission.journal.editorWallet;
    if (editorWallet) {
      await anchorAndNotify({
        topic: "HCS_TOPIC_SUBMISSIONS",
        payload: {
          type: "assignment_declined",
          submissionId,
          reviewerWallet: session,
          timestamp: new Date().toISOString(),
        },
        notifications: [
          {
            userWallet: editorWallet,
            type: "assignment_declined",
            title: "Reviewer declined assignment",
            body: `A reviewer has declined the assignment for "${submission.paper.title}".`,
            link: `/editor`,
          },
        ],
      });
    }

    return NextResponse.json({ status: "declined" });
  }

  // Accept
  await db
    .update(reviewAssignments)
    .set({ status: "accepted", acceptedAt: new Date().toISOString() })
    .where(eq(reviewAssignments.id, assignment.id));

  // Count accepted assignments — include this one deterministically
  const allAssignments = await listReviewAssignmentsForSubmission(submissionId);
  const acceptedCount = allAssignments.filter(
    a => a.status === "accepted" || a.id === assignment.id,
  ).length;

  const notifications: Parameters<typeof anchorAndNotify>[0]["notifications"] = [];
  const editorWallet = submission.journal.editorWallet;

  if (editorWallet) {
    notifications.push({
      userWallet: editorWallet,
      type: "assignment_accepted",
      title: "Reviewer accepted assignment",
      body: `A reviewer has accepted the assignment for "${submission.paper.title}".`,
      link: `/editor`,
    });
  }

  // If 2+ accepted AND submission is still in reviewers_assigned, transition to under_review
  if (
    acceptedCount >= 2 &&
    (submission.status === "reviewers_assigned" || submission.status === "criteria_published")
  ) {
    await updateSubmissionStatus(submissionId, "under_review");

    const authorWallet = submission.paper.owner?.walletAddress;
    if (authorWallet) {
      notifications.push({
        userWallet: authorWallet,
        type: "reviewers_assigned",
        title: "Paper now under review",
        body: `Minimum reviewers accepted — your paper "${submission.paper.title}" is now under review.`,
        link: `/researcher`,
      });
    }
  }

  await anchorAndNotify({
    topic: "HCS_TOPIC_SUBMISSIONS",
    payload: {
      type: "assignment_accepted",
      submissionId,
      reviewerWallet: session,
      acceptedCount,
      timestamp: new Date().toISOString(),
    },
    notifications,
  });

  return NextResponse.json({ status: "accepted", acceptedCount });
}
