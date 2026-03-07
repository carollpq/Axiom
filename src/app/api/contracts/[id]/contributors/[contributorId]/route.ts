import { NextRequest, NextResponse } from "next/server";
import { removeContributor } from "@/src/features/contracts/actions";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contributorId: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id: contractId, contributorId } = await params;

  const deleted = await removeContributor(contractId, contributorId);
  if (!deleted) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
