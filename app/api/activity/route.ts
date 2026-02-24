import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computeActivityData } from "@/features/activity/queries";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { pendingActions, activity } = computeActivityData(wallet);
  return NextResponse.json({ pendingActions, activity });
}
