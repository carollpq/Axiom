import { db } from '@/src/shared/lib/db';
import { notifications } from '@/src/shared/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { NotificationTypeDb } from '@/src/shared/lib/db/schema';

export interface CreateNotificationInput {
  userWallet: string;
  type: NotificationTypeDb;
  title: string;
  body: string;
  link?: string;
}

/** No-ops silently if wallet is null/undefined — safe to call unconditionally. */
export async function notifyIfWallet(
  wallet: string | null | undefined,
  input: Omit<CreateNotificationInput, 'userWallet'>,
): Promise<void> {
  if (!wallet) return;
  await createNotification({ userWallet: wallet, ...input });
}

export async function createNotification(input: CreateNotificationInput) {
  await db.insert(notifications).values({
    userWallet: input.userWallet.toLowerCase(),
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
  });
}

/** Scoped to userWallet — prevents marking another user's notification as read. */
export async function markAsRead(id: string, userWallet: string) {
  return (
    (
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.userWallet, userWallet.toLowerCase()),
          ),
        )
        .returning()
    )[0] ?? null
  );
}

/** Only touches unread rows — idempotent if called repeatedly. */
export async function markAllAsRead(userWallet: string) {
  return db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userWallet, userWallet.toLowerCase()),
        eq(notifications.isRead, false),
      ),
    );
}
