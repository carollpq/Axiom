import { NextRequest, NextResponse, after } from "next/server";
import { resolveRebuttal } from "@/src/features/rebuttals/actions";
import type { RebuttalResolutionDb } from "@/src/shared/lib/db/schema";
import {
  requireSession,
  requireRebuttalEditor,
  anchorAndNotify,
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

  const rebuttal = await requireRebuttalEditor(rebuttalId, session);
  if (rebuttal instanceof NextResponse) return rebuttal;

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

  const { txId: hederaTxId } = await anchorAndNotify({
    topic: "HCS_TOPIC_DECISIONS",
    payload: {
      type: "rebuttal_resolved",
      rebuttalId,
      submissionId: rebuttal.submissionId,
      resolution: body.resolution,
      timestamp: new Date().toISOString(),
    },
    notifications: rebuttal.authorWallet
      ? [
          {
            userWallet: rebuttal.authorWallet,
            type: "rebuttal_resolved",
            title: "Rebuttal resolved",
            body: `Your rebuttal has been resolved: ${body.resolution}. ${body.editorNotes || ""}`.trim(),
            link: `/researcher/rebuttal/${rebuttal.submissionId}`,
          },
        ]
      : [],
  });

  await resolveRebuttal({
    rebuttalId,
    resolution: body.resolution,
    editorNotes: body.editorNotes,
    hederaTxId,
  });

  // Non-blocking: reputation minting runs after response
  after(async () => {
    const reviewerWallets = new Set(
      rebuttal.responses.map((r) => r.review.reviewerWallet),
    );

    const eventType = body.resolution === "upheld" ? "rebuttal_upheld" as const : "rebuttal_overturned" as const;
    const scoreDelta = body.resolution === "upheld" ? -2 : body.resolution === "rejected" ? 1 : 0;

    await Promise.all(
      [...reviewerWallets].map((reviewerWallet) =>
        recordReputation(
          reviewerWallet,
          eventType,
          scoreDelta,
          `Rebuttal ${body.resolution} for submission ${rebuttal.submissionId}`,
          { type: eventType, rebuttalId, resolution: body.resolution },
        ),
      ),
    );
  });

  return NextResponse.json({ resolution: body.resolution, hederaTxId });
}
