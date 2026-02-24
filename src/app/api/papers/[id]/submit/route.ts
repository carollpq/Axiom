import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getPaperById } from "@/src/features/papers/queries";
import { createSubmission, updatePaper, updateSubmissionHedera } from "@/src/features/papers/actions";
import { isHederaConfigured } from "@/src/shared/lib/hedera/client";
import { submitHcsMessage } from "@/src/shared/lib/hedera/hcs";
import { db } from "@/src/shared/lib/db";
import { paperVersions, users } from "@/src/shared/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { journalId } = body as { journalId?: string };

  if (!journalId) {
    return NextResponse.json({ error: "journalId is required" }, { status: 400 });
  }

  const paper = await getPaperById(id);
  if (!paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  // Verify ownership via session wallet (never trust wallet from body)
  const owner = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, sessionWallet.toLowerCase()))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (!owner || paper.ownerId !== owner.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (paper.status !== "registered") {
    return NextResponse.json(
      { error: "Paper must be registered before submitting" },
      { status: 400 },
    );
  }

  // Find the latest version
  const latestVersion = await db
    .select()
    .from(paperVersions)
    .where(eq(paperVersions.paperId, id))
    .orderBy(desc(paperVersions.versionNumber))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (!latestVersion) {
    return NextResponse.json({ error: "No paper version found" }, { status: 400 });
  }

  const submission = await createSubmission({
    paperId: id,
    journalId,
    versionId: latestVersion.id,
  });

  if (!submission) {
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }

  let hederaTxId: string | undefined;
  let hederaTimestamp: string | undefined;

  if (isHederaConfigured() && process.env.HCS_TOPIC_SUBMISSIONS) {
    try {
      const { txId, consensusTimestamp } = await submitHcsMessage(
        process.env.HCS_TOPIC_SUBMISSIONS,
        {
          type: "submitted",
          paperId: id,
          journalId,
          versionId: latestVersion.id,
          submissionId: submission.id,
          submittedAt: new Date().toISOString(),
        },
      );
      hederaTxId = txId;
      hederaTimestamp = consensusTimestamp;
      await updateSubmissionHedera(submission.id, txId, consensusTimestamp);
    } catch (err) {
      console.error("[HCS] Submission anchor failed:", err);
    }
  }

  await updatePaper(id, { status: "submitted" });

  return NextResponse.json({
    submissionId: submission.id,
    hederaTxId,
    hederaTimestamp,
  });
}
