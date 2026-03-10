'use server';

import { after } from 'next/server';
import { db } from '@/src/shared/lib/db';
import { journalReviewers, journals } from '@/src/shared/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/src/shared/lib/server-action-helpers';
import { ROUTES } from '@/src/shared/lib/routes';
import { respondToPoolInvite } from '@/src/features/reviewer/mutations';
import { createNotification } from '@/src/features/notifications/mutations';

export async function respondToPoolInviteAction(
  inviteId: string,
  status: 'accepted' | 'rejected',
) {
  const session = await requireAuth();

  const [invite] = await db
    .select()
    .from(journalReviewers)
    .where(
      and(
        eq(journalReviewers.id, inviteId),
        eq(journalReviewers.reviewerWallet, session.toLowerCase()),
      ),
    )
    .limit(1);

  if (!invite) {
    throw new Error('Pool invite not found or access denied');
  }

  const updated = await respondToPoolInvite(inviteId, session, status);

  // Non-blocking: notify editor
  after(async () => {
    const [journalRow] = await db
      .select({ name: journals.name, editorWallet: journals.editorWallet })
      .from(journals)
      .where(eq(journals.id, invite.journalId))
      .limit(1);

    if (journalRow?.editorWallet) {
      const notificationType =
        status === 'accepted'
          ? 'pool_invite_accepted'
          : ('pool_invite_rejected' as const);
      const title =
        status === 'accepted'
          ? 'Reviewer joined pool'
          : 'Reviewer declined pool invite';
      const bodyText =
        status === 'accepted'
          ? `${session.slice(0, 8)}... has accepted your invitation to the reviewer pool for ${journalRow.name}.`
          : `${session.slice(0, 8)}... has declined your invitation to the reviewer pool for ${journalRow.name}.`;

      await createNotification({
        userWallet: journalRow.editorWallet,
        type: notificationType,
        title,
        body: bodyText,
        link: ROUTES.editor.management,
      });
    }
  });

  return updated;
}
