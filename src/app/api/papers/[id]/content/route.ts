export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getPaperById } from "@/src/features/papers/queries";
import { getFileFromR2, isStorageConfigured } from "@/src/shared/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const buffer = await getFileFromR2(latestVersion.fileStorageKey);

  return NextResponse.json({
    ciphertext: buffer.toString("base64"),
    dataToEncryptHash: paper.litDataToEncryptHash ?? null,
    accessConditionsJson: paper.litAccessConditionsJson ?? null,
  });
}
