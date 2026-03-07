import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/src/shared/lib/db";
import { submissions } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { openRebuttal } from "@/src/features/rebuttals/actions";
import { updateSubmissionStatus } from "@/src/features/reviews/actions";
import {
  requireSession,
  anchorAndNotify,
  anchorToHcs,
  daysFromNow,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: submissionId } = await params;
  const body = (await req.json()) as { action: "accept" | "request_rebuttal" };

  if (!body.action || !["accept", "request_rebuttal"].includes(body.action)) {
    return NextResponse.json(
      { error: "action must be 'accept' or 'request_rebuttal'" },
      { status: 400 },
    );
  }

  // Load submission with paper owner + journal
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { paper: { with: { owner: true } }, journal: true },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Verify paper ownership via wallet comparison (owner already loaded)
  if (submission.paper.owner?.walletAddress?.toLowerCase() !== session.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Guard: must be in reviews_completed status
  if (submission.status !== "reviews_completed") {
    return NextResponse.json(
      { error: "Submission must be in reviews_completed status" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const editorWallet = submission.journal.editorWallet;

  if (body.action === "accept") {
    await updateSubmissionStatus(submissionId, "reviews_completed", {
      authorResponseStatus: "accepted",
      authorResponseAt: now,
    });

    // Non-blocking: HCS anchor + notification
    after(async () => {
      const { txId } = await anchorAndNotify({
        topic: "HCS_TOPIC_SUBMISSIONS",
        payload: {
          type: "author_response",
          submissionId,
          action: "accept",
          authorWallet: session,
          timestamp: now,
        },
        notifications: editorWallet
          ? [
              {
                userWallet: editorWallet,
                type: "author_response",
                title: "Author accepted reviews",
                body: `The author has accepted reviews for "${submission.paper.title}".`,
                link: `/editor`,
              },
            ]
          : [],
      });

      if (txId) {
        await updateSubmissionStatus(submissionId, "reviews_completed", {
          authorResponseTxId: txId,
        });
      }
    });

    return NextResponse.json({ status: "accepted" });
  }

  // Request rebuttal — DB updates first (critical path)
  const deadline = daysFromNow(14);

  await updateSubmissionStatus(submissionId, "rebuttal_open", {
    authorResponseStatus: "rebuttal_requested",
    authorResponseAt: now,
  });

  const rebuttal = await openRebuttal({
    submissionId,
    authorWallet: session,
    deadline,
  });

  // Non-blocking: HCS anchoring + notifications
  after(async () => {
    const { txId: hederaTxId } = await anchorToHcs("HCS_TOPIC_DECISIONS", {
      type: "rebuttal_requested",
      submissionId,
      authorWallet: session,
      deadline,
      timestamp: now,
    });

    if (hederaTxId) {
      await updateSubmissionStatus(submissionId, "rebuttal_open", {
        authorResponseTxId: hederaTxId,
      });
    }

    if (editorWallet) {
      await anchorAndNotify({
        topic: "HCS_TOPIC_SUBMISSIONS",
        payload: {
          type: "author_response",
          submissionId,
          action: "request_rebuttal",
          authorWallet: session,
          timestamp: now,
        },
        notifications: [
          {
            userWallet: editorWallet,
            type: "author_response",
            title: "Author requested rebuttal",
            body: `The author has requested a rebuttal for "${submission.paper.title}".`,
            link: `/editor`,
          },
        ],
      });
    }
  });

  return NextResponse.json({
    status: "rebuttal_requested",
    rebuttalId: rebuttal?.id,
    deadline,
  });
}
