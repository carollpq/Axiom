import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getPaperById } from "@/src/features/papers/queries";
import { updatePaper } from "@/src/features/papers/actions";
import { getContractById } from "@/src/features/contracts/queries";
import { db } from "@/src/shared/lib/db";
import { submissions, journals } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
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

  const { id } = await params;
  const body = await req.json();
  const { journalId, contractId } = body as { journalId?: string; contractId?: string };

  if (!journalId || !contractId) {
    return NextResponse.json({ error: "journalId and contractId are required" }, { status: 400 });
  }

  const paper = await getPaperById(id);
  if (!paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  if (paper.owner.walletAddress !== sessionWallet) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowedStatuses = ["draft", "registered", "contract_pending"];
  if (!allowedStatuses.includes(paper.status)) {
    return NextResponse.json(
      { error: `Paper cannot be submitted from status: ${paper.status}` },
      { status: 422 },
    );
  }

  const contract = await getContractById(contractId);
  if (!contract || contract.status !== "fully_signed") {
    return NextResponse.json(
      { error: "Contract must be fully signed before submission" },
      { status: 422 },
    );
  }

  if (contract.paperId && contract.paperId !== id) {
    return NextResponse.json(
      { error: "Contract is not linked to this paper" },
      { status: 422 },
    );
  }

  const journal = (await db.select().from(journals).where(eq(journals.id, journalId)).limit(1))[0];
  if (!journal) {
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });
  }

  const latestVersionId = paper.versions.at(-1)?.id ?? null;

  const submission = (
    await db
      .insert(submissions)
      .values({
        paperId: id,
        journalId,
        versionId: latestVersionId,
        status: "submitted",
      })
      .returning()
  )[0];

  await updatePaper(id, { status: "submitted" });

  if (isHederaConfigured() && process.env.HCS_TOPIC_SUBMISSIONS) {
    try {
      await submitHcsMessage(process.env.HCS_TOPIC_SUBMISSIONS, {
        type: "submitted",
        paperId: id,
        journalId,
        contractId,
        submissionId: submission.id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[HCS] Submission anchoring failed:", err);
    }
  }

  return NextResponse.json({ submissionId: submission.id });
}
