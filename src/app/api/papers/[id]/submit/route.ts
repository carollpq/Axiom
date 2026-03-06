import { NextRequest, NextResponse } from "next/server";
import { getPaperById } from "@/src/features/papers/queries";
import { getContractById } from "@/src/features/contracts/queries";
import { createSubmission, updatePaper, updateSubmissionHedera } from "@/src/features/papers/actions";
import { db } from "@/src/shared/lib/db";
import { paperVersions, users } from "@/src/shared/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession, anchorToHcs } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const { journalId, contractId, versionId } = body as {
    journalId?: string;
    contractId?: string;
    versionId?: string;
  };

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
    .where(eq(users.walletAddress, session.toLowerCase()))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (!owner || paper.ownerId !== owner.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate authorship contract: look up by explicit contractId, or fall back to paper relation
  const contract = contractId
    ? await getContractById(contractId)
    : paper.contracts?.[0] ?? null;

  if (!contract) {
    return NextResponse.json(
      { error: "No authorship contract found. Please create and sign one first." },
      { status: 400 },
    );
  }

  if (contract.status !== "fully_signed") {
    const unsigned = contract.contributors?.filter(c => c.status !== "signed") ?? [];
    return NextResponse.json({
      error: "All co-authors must sign the authorship contract before submission",
      unsignedContributors: unsigned.map(c => ({
        wallet: c.contributorWallet,
        name: c.contributorName,
      })),
    }, { status: 400 });
  }

  if (paper.status !== "registered") {
    return NextResponse.json(
      { error: "Paper must be registered before submitting" },
      { status: 400 },
    );
  }

  // Use explicit versionId from body, or fall back to latest version
  let resolvedVersionId = versionId;
  if (!resolvedVersionId) {
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
    resolvedVersionId = latestVersion.id;
  }

  const submission = await createSubmission({
    paperId: id,
    journalId,
    versionId: resolvedVersionId,
  });

  if (!submission) {
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }

  const { txId: hederaTxId, consensusTimestamp: hederaTimestamp } = await anchorToHcs(
    "HCS_TOPIC_SUBMISSIONS",
    {
      type: "submitted",
      paperId: id,
      journalId,
      versionId: resolvedVersionId,
      submissionId: submission.id,
      submittedAt: new Date().toISOString(),
    },
  );

  if (hederaTxId && hederaTimestamp) {
    await updateSubmissionHedera(submission.id, hederaTxId, hederaTimestamp);
  }

  await updatePaper(id, { status: "submitted" });

  return NextResponse.json({
    submissionId: submission.id,
    hederaTxId,
    hederaTimestamp,
  });
}
