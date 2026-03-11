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

export function notifyIfWallet(
  wallet: string | null | undefined,
  input: Omit<CreateNotificationInput, 'userWallet'>,
): Promise<void> {
  if (!wallet) return Promise.resolve();
  return createNotification({ userWallet: wallet, ...input }).then(() => {});
}

export async function createNotification(input: CreateNotificationInput) {
  return (
    (
      await db
        .insert(notifications)
        .values({
          userWallet: input.userWallet.toLowerCase(),
          type: input.type,
          title: input.title,
          body: input.body,
          link: input.link ?? null,
        })
        .returning()
    )[0] ?? null
  );
}

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

export async function markAllAsRead(userWallet: string) {
  return db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userWallet, userWallet.toLowerCase()));
}
