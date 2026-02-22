import { NextRequest, NextResponse } from "next/server";
import { createPaperVersion, updatePaperVersionHedera } from "@/features/papers";
import { isHederaConfigured } from "@/lib/hedera/client";
import { submitHcsMessage } from "@/lib/hedera/hcs";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { paperHash } = body;

  if (!paperHash) {
    return NextResponse.json(
      { error: "paperHash is required" },
      { status: 400 },
    );
  }

  const version = createPaperVersion({
    paperId: id,
    paperHash,
    datasetHash: body.datasetHash ?? null,
    codeRepoUrl: body.codeRepoUrl ?? null,
    codeCommitHash: body.codeCommitHash ?? null,
    envSpecHash: body.envSpecHash ?? null,
  });

  if (!version) {
    return NextResponse.json({ error: "paper not found" }, { status: 404 });
  }

  // Anchor on Hedera HCS — skipped gracefully if credentials are not configured
  if (isHederaConfigured() && process.env.HCS_TOPIC_PAPERS) {
    try {
      const hcsPayload = {
        type: "register",
        paperHash,
        paperId: id,
        versionId: version.id,
        versionNumber: version.versionNumber,
        ...(body.datasetHash && { datasetHash: body.datasetHash }),
        ...(body.codeCommitHash && { codeCommitHash: body.codeCommitHash }),
        ...(body.envSpecHash && { envSpecHash: body.envSpecHash }),
        timestamp: new Date().toISOString(),
      };

      const { txId, consensusTimestamp } = await submitHcsMessage(
        process.env.HCS_TOPIC_PAPERS,
        hcsPayload,
      );

      const updated = updatePaperVersionHedera(version.id, txId, consensusTimestamp);
      return NextResponse.json(updated ?? version, { status: 201 });
    } catch (err) {
      // HCS failure is non-fatal — return the version without on-chain data
      console.error("[HCS] Paper registration failed:", err);
    }
  }

  return NextResponse.json(version, { status: 201 });
}
