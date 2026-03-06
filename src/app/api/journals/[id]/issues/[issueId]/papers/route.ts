import { NextResponse } from "next/server";
import { requireSession, requireJournalEditor } from "@/src/shared/lib/api-helpers";
import { addPaperToIssue, removePaperFromIssue } from "@/src/features/editor/actions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; issueId: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id, issueId } = await params;
  const journal = await requireJournalEditor(id, wallet);
  if (journal instanceof NextResponse) return journal;

  const { submissionId } = (await request.json()) as { submissionId?: string };
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  const row = await addPaperToIssue(issueId, submissionId);
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; issueId: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id, issueId } = await params;
  const journal = await requireJournalEditor(id, wallet);
  if (journal instanceof NextResponse) return journal;

  const { submissionId } = (await request.json()) as { submissionId?: string };
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  await removePaperFromIssue(issueId, submissionId);
  return NextResponse.json({ ok: true });
}
