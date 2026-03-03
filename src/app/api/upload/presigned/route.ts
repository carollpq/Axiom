import { NextRequest, NextResponse } from "next/server";
import { isStorageConfigured, getPresignedUploadUrl } from "@/src/shared/lib/storage";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 },
    );
  }

  const body = await req.json();
  const { hash, contentType, folder } = body as {
    hash: string;
    contentType: string;
    folder: "papers" | "datasets" | "environments";
  };

  if (!hash || !folder) {
    return NextResponse.json(
      { error: "hash and folder are required" },
      { status: 400 },
    );
  }

  if (!["papers", "datasets", "environments"].includes(folder)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  try {
    const result = await getPresignedUploadUrl(
      hash,
      contentType || "application/octet-stream",
      folder,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("[R2] Presigned URL generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
