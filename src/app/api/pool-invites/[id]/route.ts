import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/src/shared/lib/api-helpers';
import { respondToPoolInvite } from '@/src/features/reviewer/actions';
import { createNotification } from '@/src/features/notifications/actions';
import { db } from '@/src/shared/lib/db';
import { journalReviewers, journals } from '@/src/shared/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = (await req.json()) as { status: 'accepted' | 'rejected' };

  if (!body.status || !['accepted', 'rejected'].includes(body.status)) {
    return NextResponse.json(
      { error: "status must be 'accepted' or 'rejected'" },
      { status: 400 },
    );
  }

  // Get the pool invite to verify it belongs to the current user
  const [invite] = await db
    .select()
    .from(journalReviewers)
    .where(
      and(
        eq(journalReviewers.id, id),
        eq(journalReviewers.reviewerWallet, session.toLowerCase()),
      ),
    )
    .limit(1);

  if (!invite) {
    return NextResponse.json(
      { error: 'Pool invite not found or access denied' },
      { status: 404 },
    );
  }

  // Update the invite status
  const updated = await respondToPoolInvite(id, session, body.status);

  // Get journal info for notification
  const [journalRow] = await db
    .select()
    .from(journals)
    .where(eq(journals.id, invite.journalId))
    .limit(1);

  if (journalRow) {
    const notificationType =
      body.status === 'accepted'
        ? 'pool_invite_accepted'
        : ('pool_invite_rejected' as const);
    const title =
      body.status === 'accepted'
        ? 'Reviewer joined pool'
        : 'Reviewer declined pool invite';
    const body_text =
      body.status === 'accepted'
        ? `${session.slice(0, 8)}... has accepted your invitation to the reviewer pool for ${journalRow.name}.`
        : `${session.slice(0, 8)}... has declined your invitation to the reviewer pool for ${journalRow.name}.`;

    // Notify the editor
    if (journalRow.editorWallet) {
      await createNotification({
        userWallet: journalRow.editorWallet,
        type: notificationType,
        title,
        body: body_text,
        link: `/editor/management`,
      });
    }
  }

  return NextResponse.json(updated, { status: 200 });
}
