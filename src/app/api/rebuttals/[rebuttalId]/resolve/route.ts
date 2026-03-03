import { NextRequest, NextResponse } from "next/server";
import { getRebuttalById } from "@/src/features/rebuttals/queries";
import { resolveRebuttal } from "@/src/features/rebuttals/actions";
import { createNotification } from "@/src/features/notifications/actions";
import type { RebuttalResolutionDb } from "@/src/shared/lib/db/schema";
import {
  requireSession,
  anchorToHcs,
  recordReputation,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ rebuttalId: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { rebuttalId } = await params;

  const rebuttal = await getRebuttalById(rebuttalId);
  if (!rebuttal) {
    return NextResponse.json({ error: "Rebuttal not found" }, { status: 404 });
  }

  if (!rebuttal.submission?.journal) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (rebuttal.submission.journal.editorWallet.toLowerCase() !== session.toLowerCase()) {
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

  const { txId: hederaTxId } = await anchorToHcs("HCS_TOPIC_DECISIONS", {
    type: "rebuttal_resolved",
    rebuttalId,
    submissionId: rebuttal.submissionId,
    resolution: body.resolution,
    timestamp: new Date().toISOString(),
  });

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

    await recordReputation(
      reviewerWallet,
      eventType,
      scoreDelta,
      `Rebuttal ${body.resolution} for submission ${rebuttal.submissionId}`,
      { type: eventType, rebuttalId, resolution: body.resolution },
    );
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
