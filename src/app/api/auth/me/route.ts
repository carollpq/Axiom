import { NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth";
import { getOrCreateUser } from "@/src/features/users/queries";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(wallet);
  return NextResponse.json(user);
}
