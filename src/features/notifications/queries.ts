import { db } from "@/src/shared/lib/db";
import { notifications } from "@/src/shared/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function listNotifications(userWallet: string, limit = 20) {
  return db.query.notifications.findMany({
    where: eq(notifications.userWallet, userWallet.toLowerCase()),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
    limit,
  });
}

export async function countUnread(userWallet: string): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userWallet, userWallet.toLowerCase()),
        eq(notifications.isRead, false),
      ),
    );
  return result[0]?.value ?? 0;
}
