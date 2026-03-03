import { NextRequest, NextResponse } from "next/server";
import { createPaperVersion, updatePaperVersionHedera } from "@/src/features/papers/actions";
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
  const { paperHash } = body;

  if (!paperHash) {
    return NextResponse.json(
      { error: "paperHash is required" },
      { status: 400 },
    );
  }

  const version = await createPaperVersion({
    paperId: id,
    paperHash,
    datasetHash: body.datasetHash ?? null,
    codeRepoUrl: body.codeRepoUrl ?? null,
    codeCommitHash: body.codeCommitHash ?? null,
    envSpecHash: body.envSpecHash ?? null,
    fileStorageKey: body.fileStorageKey ?? null,
  });

  if (!version) {
    return NextResponse.json({ error: "paper not found" }, { status: 404 });
  }

  // Anchor on Hedera HCS — skipped gracefully if credentials are not configured
  const { txId, consensusTimestamp } = await anchorToHcs("HCS_TOPIC_PAPERS", {
    type: "register",
    paperHash,
    paperId: id,
    versionId: version.id,
    versionNumber: version.versionNumber,
    ...(body.datasetHash && { datasetHash: body.datasetHash }),
    ...(body.codeCommitHash && { codeCommitHash: body.codeCommitHash }),
    ...(body.envSpecHash && { envSpecHash: body.envSpecHash }),
    timestamp: new Date().toISOString(),
  });

  if (txId && consensusTimestamp) {
    const updated = await updatePaperVersionHedera(version.id, txId, consensusTimestamp);
    return NextResponse.json(updated ?? version, { status: 201 });
  }

  return NextResponse.json(version, { status: 201 });
}
