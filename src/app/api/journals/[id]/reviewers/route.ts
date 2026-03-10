import { NextResponse } from 'next/server';
import {
  requireSession,
  requireJournalEditor,
} from '@/src/shared/lib/api-helpers';
import {
  addReviewerToPool,
  removeReviewerFromPool,
} from '@/src/features/editor/actions';
import { createNotification } from '@/src/features/notifications/actions';
import { db } from '@/src/shared/lib/db';
import { journals } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id } = await params;
  const journal = await requireJournalEditor(id, wallet);
  if (journal instanceof NextResponse) return journal;

  const { reviewerWallet } = (await request.json()) as {
    reviewerWallet?: string;
  };
  if (!reviewerWallet) {
    return NextResponse.json(
      { error: 'reviewerWallet is required' },
      { status: 400 },
    );
  }

  const row = await addReviewerToPool(id, reviewerWallet);

  // Notify the reviewer that they've been added to the pool
  const [journalRow] = await db
    .select({ name: journals.name })
    .from(journals)
    .where(eq(journals.id, id))
    .limit(1);

  if (journalRow) {
    await createNotification({
      userWallet: reviewerWallet,
      type: 'pool_added',
      title: 'Added to reviewer pool',
      body: `You have been added to the reviewer pool for ${journalRow.name}. You may be assigned to review submissions.`,
      link: `/reviewer`,
    });
  }

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

  const { reviewerWallet } = (await request.json()) as {
    reviewerWallet?: string;
  };
  if (!reviewerWallet) {
    return NextResponse.json(
      { error: 'reviewerWallet is required' },
      { status: 400 },
    );
  }

  await removeReviewerFromPool(id, reviewerWallet);
  return NextResponse.json({ ok: true });
}
