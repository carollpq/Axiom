import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/shared/lib/db";
import { paperVersions } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { hash?: string };

  if (!body.hash || typeof body.hash !== "string") {
    return NextResponse.json({ error: "hash is required" }, { status: 400 });
  }

  const version = await db.query.paperVersions.findFirst({
    where: eq(paperVersions.paperHash, body.hash),
    with: {
      paper: {
        with: { owner: true },
      },
    },
    orderBy: (v, { desc }) => [desc(v.versionNumber)],
  });

  if (!version || !version.paper) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    title: version.paper.title,
    registeredAt: version.createdAt,
    hederaTxId: version.hederaTxId ?? null,
    versionNumber: version.versionNumber,
    author: version.paper.owner?.displayName ?? version.paper.owner?.walletAddress ?? null,
  });
}
