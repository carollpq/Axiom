import { NextResponse } from "next/server";
import { requireSession, requireJournalEditor } from "@/src/shared/lib/api-helpers";
import { addReviewerToPool, removeReviewerFromPool } from "@/src/features/editor/actions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id } = await params;
  const journal = await requireJournalEditor(id, wallet);
  if (journal instanceof NextResponse) return journal;

  const { reviewerWallet } = (await request.json()) as { reviewerWallet?: string };
  if (!reviewerWallet) {
    return NextResponse.json({ error: "reviewerWallet is required" }, { status: 400 });
  }

  const row = await addReviewerToPool(id, reviewerWallet);
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id } = await params;
  const journal = await requireJournalEditor(id, wallet);
  if (journal instanceof NextResponse) return journal;

  const { reviewerWallet } = (await request.json()) as { reviewerWallet?: string };
  if (!reviewerWallet) {
    return NextResponse.json({ error: "reviewerWallet is required" }, { status: 400 });
  }

  await removeReviewerFromPool(id, reviewerWallet);
  return NextResponse.json({ ok: true });
}
