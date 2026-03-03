import { NextRequest, NextResponse } from "next/server";
import { listUserPapers } from "@/src/features/papers/queries";
import { createPaper } from "@/src/features/papers/actions";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const result = await listUserPapers(wallet);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const body = await req.json();
  const { title } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const paper = await createPaper({ ...body, wallet });
  if (!paper) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(paper, { status: 201 });
}
