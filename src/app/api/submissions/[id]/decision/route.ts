import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { db } from "@/src/shared/lib/db";
import { submissions } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateSubmissionStatus } from "@/src/features/reviews/actions";
import { createNotification } from "@/src/features/notifications/actions";
import { isHederaConfigured } from "@/src/shared/lib/hedera/client";
import { submitHcsMessage } from "@/src/shared/lib/hedera/hcs";

export const runtime = "nodejs";

type Decision = "accept" | "reject" | "revise";

const STATUS_MAP: Record<Decision, string> = {
  accept: "accepted",
  reject: "rejected",
  revise: "revision_requested",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: submissionId } = await params;

  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { journal: true, paper: { with: { owner: true } } },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.journal.editorWallet.toLowerCase() !== sessionWallet.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  let hederaTxId: string | undefined;

  if (isHederaConfigured() && process.env.HCS_TOPIC_DECISIONS) {
    try {
      const { txId } = await submitHcsMessage(process.env.HCS_TOPIC_DECISIONS, {
        type: "editorial_decision",
        submissionId,
        decision: body.decision,
        allCriteriaMet: body.allCriteriaMet,
        // Only include public justification in HCS — confidential comments stay off-chain
        publicJustification: body.allCriteriaMet && body.decision === "reject" ? body.comment : null,
        timestamp: new Date().toISOString(),
      });
      hederaTxId = txId;
    } catch (err) {
      console.error("[HCS] Decision anchor failed:", err);
    }
  }

  const newStatus = STATUS_MAP[body.decision];
  await updateSubmissionStatus(submissionId, newStatus, {
    decision: body.decision,
    decisionJustification: body.comment ?? null,
    decisionTxId: hederaTxId ?? null,
    decidedAt: new Date().toISOString(),
  });

  // Notify the paper author
  if (submission.paper?.owner?.walletAddress) {
    const decisionLabel = body.decision === "accept" ? "accepted" : body.decision === "reject" ? "rejected" : "revision requested";
    await createNotification({
      userWallet: submission.paper.owner.walletAddress,
      type: "decision_made",
      title: `Paper ${decisionLabel}`,
      body: `Your paper "${submission.paper.title}" has been ${decisionLabel}.`,
      link: `/researcher`,
    });
  }

  return NextResponse.json({ hederaTxId, status: newStatus });
}
