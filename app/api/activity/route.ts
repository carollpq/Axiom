import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computeActivityData } from "@/features/author/queries/activity";
import { listUserPapers } from "@/features/papers/queries";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const papers = await listUserPapers(wallet);
  const { pendingActions, activity } = await computeActivityData(wallet, papers);
  return NextResponse.json({ pendingActions, activity });
}
