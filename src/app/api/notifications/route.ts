import { NextRequest, NextResponse } from "next/server";
import { listNotifications, countUnread } from "@/src/features/notifications/queries";
import { markAsRead, markAllAsRead } from "@/src/features/notifications/actions";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const [items, unreadCount] = await Promise.all([
    listNotifications(wallet),
    countUnread(wallet),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const body = (await req.json()) as { id?: string; markAll?: boolean };

  if (body.markAll) {
    await markAllAsRead(wallet);
    return NextResponse.json({ success: true });
  }

  if (body.id) {
    const updated = await markAsRead(body.id, wallet);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide id or markAll" }, { status: 400 });
}
