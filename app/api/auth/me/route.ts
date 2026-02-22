import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/features/users";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet param required" }, { status: 400 });
  }

  const user = getOrCreateUser(wallet);
  return NextResponse.json(user);
}
