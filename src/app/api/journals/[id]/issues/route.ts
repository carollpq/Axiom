import { NextResponse } from "next/server";
import { requireSession, requireJournalEditor } from "@/src/shared/lib/api-helpers";
import { listJournalIssues } from "@/src/features/editor/queries";
import { createJournalIssue } from "@/src/features/editor/actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id } = await params;
  const journal = await requireJournalEditor(id, wallet);
  if (journal instanceof NextResponse) return journal;

  const issues = await listJournalIssues(id);
  return NextResponse.json(issues);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id } = await params;
  const journal = await requireJournalEditor(id, wallet);
  if (journal instanceof NextResponse) return journal;

  const { label } = (await request.json()) as { label?: string };
  if (!label?.trim()) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const issue = await createJournalIssue(id, label.trim());
  return NextResponse.json(issue, { status: 201 });
}
