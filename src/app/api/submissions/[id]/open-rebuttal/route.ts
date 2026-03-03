import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { db } from "@/src/shared/lib/db";
import { submissions } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { openRebuttal } from "@/src/features/rebuttals/actions";
import { updateSubmissionStatus } from "@/src/features/reviews/actions";
import { createNotification } from "@/src/features/notifications/actions";
import { isHederaConfigured } from "@/src/shared/lib/hedera/client";
import { submitHcsMessage } from "@/src/shared/lib/hedera/hcs";

export const runtime = "nodejs";

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

  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  let hederaTxId: string | undefined;
  if (isHederaConfigured() && process.env.HCS_TOPIC_DECISIONS) {
    try {
      const { txId } = await submitHcsMessage(process.env.HCS_TOPIC_DECISIONS, {
        type: "rebuttal_opened",
        submissionId,
        deadline,
        timestamp: new Date().toISOString(),
      });
      hederaTxId = txId;
    } catch (err) {
      console.error("[HCS] Rebuttal open anchor failed:", err);
    }
  }

  const authorWallet = submission.paper.owner?.walletAddress ?? "";

  const rebuttal = await openRebuttal({
    submissionId,
    authorWallet,
    deadline,
    hederaTxId,
  });

  await updateSubmissionStatus(submissionId, "rebuttal_open");

  if (authorWallet) {
    await createNotification({
      userWallet: authorWallet,
      type: "rebuttal_opened",
      title: "Rebuttal phase opened",
      body: `The editor has opened a rebuttal phase for "${submission.paper.title}". You have 14 days to respond.`,
      link: `/researcher/rebuttal/${submissionId}`,
    });
  }

  return NextResponse.json({ rebuttalId: rebuttal?.id, deadline, hederaTxId });
}
