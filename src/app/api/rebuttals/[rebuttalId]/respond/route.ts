import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitRebuttalResponses } from "@/src/features/rebuttals/actions";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import type { RebuttalPositionDb } from "@/src/shared/lib/db/schema";
import {
  requireSession,
  requireRebuttalAuthor,
  anchorAndNotify,
  validationError,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

const respondSchema = z.object({
  responses: z.array(z.object({
    reviewId: z.string().min(1),
    criterionId: z.string().nullish(),
    position: z.enum(["agree", "disagree"] as [RebuttalPositionDb, ...RebuttalPositionDb[]]),
    justification: z.string().trim().min(10).max(10_000),
    evidence: z.string().trim().max(10_000).nullish(),
  })).min(1).max(50),
});

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

  const body = await req.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const rebuttalHash = await hashString(canonicalJson(parsed.data.responses));

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

  const responses = parsed.data.responses.map((r) => ({
    ...r,
    rebuttalId,
  }));

  await submitRebuttalResponses(rebuttalId, responses, rebuttalHash, hederaTxId);

  return NextResponse.json({ rebuttalHash, hederaTxId });
}
