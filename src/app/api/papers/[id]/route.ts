import { NextRequest, NextResponse } from "next/server";
import { getPaperById } from "@/src/features/papers/queries";
import { updatePaper } from "@/src/features/papers/actions";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paper = await getPaperById(id);

  if (!paper) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(paper);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id } = await params;
  const body = await req.json();

  const updated = await updatePaper(id, body);
  if (!updated) {
    return NextResponse.json({ error: "not found or no valid fields" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
