import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrCreateUser } from "@/features/users";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = getOrCreateUser(wallet);
  return NextResponse.json(user);
}
