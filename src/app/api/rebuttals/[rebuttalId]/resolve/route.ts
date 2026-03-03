import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getRebuttalById } from "@/src/features/rebuttals/queries";
import { resolveRebuttal } from "@/src/features/rebuttals/actions";
import { createReputationEvent } from "@/src/features/reviews/actions";
import { createNotification } from "@/src/features/notifications/actions";
import { isHederaConfigured } from "@/src/shared/lib/hedera/client";
import { submitHcsMessage } from "@/src/shared/lib/hedera/hcs";
import { mintReputationToken } from "@/src/shared/lib/hedera/hts";
import type { RebuttalResolutionDb } from "@/src/shared/lib/db/schema";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ rebuttalId: string }> },
) {
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rebuttalId } = await params;

  const rebuttal = await getRebuttalById(rebuttalId);
  if (!rebuttal) {
    return NextResponse.json({ error: "Rebuttal not found" }, { status: 404 });
  }

  if (!rebuttal.submission?.journal) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (rebuttal.submission.journal.editorWallet.toLowerCase() !== sessionWallet.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (rebuttal.status !== "submitted") {
    return NextResponse.json({ error: "Rebuttal must be submitted before resolving" }, { status: 400 });
  }

  const body = (await req.json()) as {
    resolution: RebuttalResolutionDb;
    editorNotes: string;
  };

  if (!body.resolution || !["upheld", "rejected", "partial"].includes(body.resolution)) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  }

  let hederaTxId: string | undefined;
  if (isHederaConfigured() && process.env.HCS_TOPIC_DECISIONS) {
    try {
      const { txId } = await submitHcsMessage(process.env.HCS_TOPIC_DECISIONS, {
        type: "rebuttal_resolved",
        rebuttalId,
        submissionId: rebuttal.submissionId,
        resolution: body.resolution,
        timestamp: new Date().toISOString(),
      });
      hederaTxId = txId;
    } catch (err) {
      console.error("[HCS] Rebuttal resolution anchor failed:", err);
    }
  }

  await resolveRebuttal({
    rebuttalId,
    resolution: body.resolution,
    editorNotes: body.editorNotes,
    hederaTxId,
  });

  // Mint reputation tokens for affected reviewers
  const reviewerWallets = new Set(
    rebuttal.responses.map((r) => r.review.reviewerWallet),
  );

  for (const reviewerWallet of reviewerWallets) {
    const eventType = body.resolution === "upheld" ? "rebuttal_upheld" : "rebuttal_overturned";
    const scoreDelta = body.resolution === "upheld" ? -2 : body.resolution === "rejected" ? 1 : 0;

    const mintResult = await mintReputationToken(reviewerWallet, {
      type: eventType,
      rebuttalId,
      resolution: body.resolution,
    });

    await createReputationEvent({
      userWallet: reviewerWallet,
      eventType,
      scoreDelta,
      details: `Rebuttal ${body.resolution} for submission ${rebuttal.submissionId}`,
      htsTokenSerial: mintResult?.serial,
      hederaTxId: mintResult?.txId,
    });
  }

  // Notify author
  if (rebuttal.authorWallet) {
    await createNotification({
      userWallet: rebuttal.authorWallet,
      type: "rebuttal_resolved",
      title: "Rebuttal resolved",
      body: `Your rebuttal has been resolved: ${body.resolution}. ${body.editorNotes || ""}`.trim(),
      link: `/researcher/rebuttal/${rebuttal.submissionId}`,
    });
  }

  return NextResponse.json({ resolution: body.resolution, hederaTxId });
}
