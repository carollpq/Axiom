import { NextResponse } from "next/server";
import { requireSession, requireJournalEditor } from "@/src/shared/lib/api-helpers";
import { updateJournalMetadata } from "@/src/features/editor/actions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id } = await params;
  const journal = await requireJournalEditor(id, wallet);
  if (journal instanceof NextResponse) return journal;

  const { aimsAndScope, submissionCriteria } = (await request.json()) as {
    aimsAndScope?: string;
    submissionCriteria?: string;
  };

  await updateJournalMetadata(id, { aimsAndScope, submissionCriteria });

  return NextResponse.json({ ok: true });
}
