import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/src/shared/lib/api-helpers";
import { searchUsers } from "@/src/features/users/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const rows = await searchUsers(q);
  return NextResponse.json(rows);
}
