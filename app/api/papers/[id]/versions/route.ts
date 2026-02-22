import { NextRequest, NextResponse } from "next/server";
import { createPaperVersion } from "@/features/papers";

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

  return NextResponse.json(version, { status: 201 });
}
