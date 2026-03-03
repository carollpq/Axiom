import { NextRequest, NextResponse } from "next/server";
import { updateSubmissionStatus } from "@/src/features/reviews/actions";
import type { SubmissionStatusDb } from "@/src/shared/lib/db/schema";
import {
  requireSession,
  requireSubmissionEditor,
  anchorAndNotify,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

type Decision = "accept" | "reject" | "revise";

const STATUS_MAP: Record<Decision, SubmissionStatusDb> = {
  accept: "accepted",
  reject: "rejected",
  revise: "revision_requested",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: submissionId } = await params;

  const submission = await requireSubmissionEditor(submissionId, session);
  if (submission instanceof NextResponse) return submission;

  const body = await req.json() as {
    decision: Decision;
    comment: string;
    allCriteriaMet: boolean;
  };

  if (!body.decision || !["accept", "reject", "revise"].includes(body.decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  // If all criteria met but editor rejects, a public justification comment is required
  if (body.decision === "reject" && body.allCriteriaMet && !body.comment?.trim()) {
    return NextResponse.json(
      { error: "A public justification comment is required when rejecting a paper that meets all criteria" },
      { status: 400 },
    );
  }

  const authorWallet = submission.paper?.owner?.walletAddress;
  const decisionLabel = body.decision === "accept" ? "accepted" : body.decision === "reject" ? "rejected" : "revision requested";

  const { txId: hederaTxId } = await anchorAndNotify({
    topic: "HCS_TOPIC_DECISIONS",
    payload: {
      type: "editorial_decision",
      submissionId,
      decision: body.decision,
      allCriteriaMet: body.allCriteriaMet,
      // Only include public justification in HCS — confidential comments stay off-chain
      publicJustification: body.allCriteriaMet && body.decision === "reject" ? body.comment : null,
      timestamp: new Date().toISOString(),
    },
    notifications: authorWallet
      ? [
          {
            userWallet: authorWallet,
            type: "decision_made",
            title: `Paper ${decisionLabel}`,
            body: `Your paper "${submission.paper.title}" has been ${decisionLabel}.`,
            link: `/researcher`,
          },
        ]
      : [],
  });

  const newStatus = STATUS_MAP[body.decision];
  await updateSubmissionStatus(submissionId, newStatus, {
    decision: body.decision,
    decisionJustification: body.comment ?? null,
    decisionTxId: hederaTxId ?? null,
    decidedAt: new Date().toISOString(),
  });

  return NextResponse.json({ hederaTxId, status: newStatus });
}
