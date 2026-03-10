'use server';

import { requireSession } from '@/src/shared/lib/auth/auth';
import {
  listNotifications,
  countUnread,
} from '@/src/features/notifications/queries';
import {
  markAsRead,
  markAllAsRead,
} from '@/src/features/notifications/mutations';

export async function getNotificationsAction() {
  const wallet = await requireSession();
  const [items, unreadCount] = await Promise.all([
    listNotifications(wallet),
    countUnread(wallet),
  ]);
  return { items, unreadCount };
}

export async function markNotificationReadAction(id: string) {
  const wallet = await requireSession();
  const updated = await markAsRead(id, wallet);
  if (!updated) throw new Error('Not found');
}

export async function markAllNotificationsReadAction() {
  const wallet = await requireSession();
  await markAllAsRead(wallet);
}
