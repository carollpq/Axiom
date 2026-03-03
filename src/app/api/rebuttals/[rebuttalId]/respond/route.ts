import { NextRequest, NextResponse } from "next/server";
import { submitRebuttalResponses } from "@/src/features/rebuttals/actions";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import type { RebuttalPositionDb } from "@/src/shared/lib/db/schema";
import {
  requireSession,
  requireRebuttalAuthor,
  anchorAndNotify,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

interface ResponseInput {
  reviewId: string;
  criterionId?: string;
  position: RebuttalPositionDb;
  justification: string;
  evidence?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ rebuttalId: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { rebuttalId } = await params;

  const rebuttal = await requireRebuttalAuthor(rebuttalId, session);
  if (rebuttal instanceof NextResponse) return rebuttal;

  if (rebuttal.status !== "open") {
    return NextResponse.json({ error: "Rebuttal is not open for responses" }, { status: 400 });
  }

  if (new Date(rebuttal.deadline) < new Date()) {
    return NextResponse.json({ error: "Rebuttal deadline has passed" }, { status: 400 });
  }

  const body = (await req.json()) as { responses: ResponseInput[] };

  if (!body.responses || !Array.isArray(body.responses) || body.responses.length === 0) {
    return NextResponse.json({ error: "At least one response is required" }, { status: 400 });
  }

  const rebuttalHash = await hashString(canonicalJson(body.responses));

  const editorWallet = rebuttal.submission?.journal?.editorWallet;

  const { txId: hederaTxId } = await anchorAndNotify({
    topic: "HCS_TOPIC_DECISIONS",
    payload: {
      type: "rebuttal_submitted",
      rebuttalId,
      submissionId: rebuttal.submissionId,
      rebuttalHash,
      timestamp: new Date().toISOString(),
    },
    notifications: editorWallet
      ? [
          {
            userWallet: editorWallet,
            type: "rebuttal_submitted",
            title: "Rebuttal response submitted",
            body: `The author has responded to the rebuttal for "${rebuttal.submission.paper?.title}".`,
            link: `/editor/under-review`,
          },
        ]
      : [],
  });

  const responses = body.responses.map((r) => ({
    ...r,
    rebuttalId,
  }));

  await submitRebuttalResponses(rebuttalId, responses, rebuttalHash, hederaTxId);

  return NextResponse.json({ rebuttalHash, hederaTxId });
}
