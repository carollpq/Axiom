export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getPaperById } from "@/src/features/papers/queries";
import { getFileFromIPFS, isStorageConfigured } from "@/src/shared/lib/storage";
import { requireSession } from "@/src/shared/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const paper = await getPaperById(id);
  if (!paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const latestVersion = paper.versions?.[0] ?? null;
  if (!latestVersion?.fileStorageKey) {
    return NextResponse.json(
      { error: "No file uploaded for this paper" },
      { status: 404 },
    );
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Storage not available" },
      { status: 503 },
    );
  }

  const buffer = await getFileFromIPFS(latestVersion.fileStorageKey);

  return NextResponse.json({
    ciphertext: buffer.toString("base64"),
    dataToEncryptHash: paper.litDataToEncryptHash ?? null,
    accessConditionsJson: paper.litAccessConditionsJson ?? null,
  });
}
