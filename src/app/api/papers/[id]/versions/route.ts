import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaperVersion, updatePaperVersionHedera } from "@/src/features/papers/actions";
import { requireSession, anchorToHcs, validationError } from "@/src/shared/lib/api-helpers";
import { SHA256_REGEX } from "@/src/shared/lib/validation";

export const runtime = "nodejs";

const createVersionSchema = z.object({
  paperHash: z.string().regex(SHA256_REGEX, "Invalid SHA-256 hash"),
  datasetHash: z.string().regex(SHA256_REGEX, "Invalid SHA-256 hash").nullish(),
  codeRepoUrl: z.string().url().max(2000).nullish(),
  codeCommitHash: z.string().max(200).nullish(),
  envSpecHash: z.string().regex(SHA256_REGEX, "Invalid SHA-256 hash").nullish(),
  fileStorageKey: z.string().max(500).nullish(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const parsed = createVersionSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { paperHash, datasetHash, codeRepoUrl, codeCommitHash, envSpecHash, fileStorageKey } = parsed.data;

  const version = await createPaperVersion({
    paperId: id,
    paperHash,
    datasetHash: datasetHash ?? null,
    codeRepoUrl: codeRepoUrl ?? null,
    codeCommitHash: codeCommitHash ?? null,
    envSpecHash: envSpecHash ?? null,
    fileStorageKey: fileStorageKey ?? null,
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
    ...(datasetHash && { datasetHash }),
    ...(codeCommitHash && { codeCommitHash }),
    ...(envSpecHash && { envSpecHash }),
    timestamp: new Date().toISOString(),
  });

  if (txId && consensusTimestamp) {
    const updated = await updatePaperVersionHedera(version.id, txId, consensusTimestamp);
    return NextResponse.json(updated ?? version, { status: 201 });
  }

  return NextResponse.json(version, { status: 201 });
}
