import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getReviewAssignment } from "@/src/features/reviews/queries";
import { createReview, updateReviewHedera, createReputationEvent } from "@/src/features/reviews/actions";
import { isHederaConfigured } from "@/src/shared/lib/hedera/client";
import { submitHcsMessage } from "@/src/shared/lib/hedera/hcs";
import { db } from "@/src/shared/lib/db";
import { paperVersions } from "@/src/shared/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { mintReputationToken } from "@/src/shared/lib/hedera/hts";
import { createNotification } from "@/src/features/notifications/actions";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: assignmentId } = await params;

  const assignment = await getReviewAssignment(assignmentId, sessionWallet);
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 403 });
  }

  if (assignment.status === "submitted") {
    return NextResponse.json({ error: "Review already submitted" }, { status: 400 });
  }

  if (assignment.status === "declined") {
    return NextResponse.json({ error: "Assignment was declined" }, { status: 400 });
  }

  const body = await req.json() as {
    criteriaEvaluations: Record<string, unknown>;
    strengths: string;
    weaknesses: string;
    questionsForAuthors: string;
    confidentialEditorComments: string;
    recommendation: string;
    reviewHash: string;
  };

  if (!body.recommendation || !body.reviewHash) {
    return NextResponse.json({ error: "recommendation and reviewHash are required" }, { status: 400 });
  }

  // Get latest paper version hash for HCS message
  const latestVersion = await db
    .select()
    .from(paperVersions)
    .where(eq(paperVersions.paperId, assignment.submission.paperId))
    .orderBy(desc(paperVersions.versionNumber))
    .limit(1)
    .then(rows => rows[0] ?? null);

  const review = await createReview({
    submissionId: assignment.submissionId,
    assignmentId,
    reviewerWallet: sessionWallet,
    reviewHash: body.reviewHash,
    criteriaEvaluations: JSON.stringify(body.criteriaEvaluations),
    strengths: body.strengths ?? "",
    weaknesses: body.weaknesses ?? "",
    questionsForAuthors: body.questionsForAuthors ?? "",
    confidentialEditorComments: body.confidentialEditorComments ?? "",
    recommendation: body.recommendation,
  });

  if (!review) {
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }

  let hederaTxId: string | undefined;
  let hederaTimestamp: string | undefined;

  if (isHederaConfigured() && process.env.HCS_TOPIC_REVIEWS) {
    try {
      const { txId, consensusTimestamp } = await submitHcsMessage(
        process.env.HCS_TOPIC_REVIEWS,
        {
          type: "review_submitted",
          reviewHash: body.reviewHash,
          reviewerWallet: sessionWallet,
          submissionId: assignment.submissionId,
          paperHash: latestVersion?.paperHash ?? null,
          timestamp: new Date().toISOString(),
        },
      );
      hederaTxId = txId;
      hederaTimestamp = consensusTimestamp;
      await updateReviewHedera(review.id, txId);
    } catch (err) {
      console.error("[HCS] Review anchor failed:", err);
    }
  }

  // Create reputation event (append-only — never update or delete)
  let htsTokenSerial: string | undefined;
  try {
    const tokenResult = await mintReputationToken(sessionWallet, {
      type: "review_completed",
      reviewId: review.id,
      submissionId: assignment.submissionId,
    });
    htsTokenSerial = tokenResult?.serial;
  } catch (err) {
    console.error("[HTS] Reputation token mint failed:", err);
  }

  await createReputationEvent({
    userWallet: sessionWallet,
    eventType: "review_completed",
    scoreDelta: 1,
    details: JSON.stringify({ reviewId: review.id, submissionId: assignment.submissionId }),
    htsTokenSerial,
    hederaTxId,
  });

  // Notify editor that a review was submitted
  if (assignment.submission.journal?.editorWallet) {
    await createNotification({
      userWallet: assignment.submission.journal.editorWallet,
      type: "review_submitted",
      title: "Review submitted",
      body: `A reviewer has submitted their review for "${assignment.submission.paper.title}".`,
      link: `/editor/under-review`,
    });
  }

  return NextResponse.json({
    reviewId: review.id,
    hederaTxId,
    hederaTimestamp,
  });
}
