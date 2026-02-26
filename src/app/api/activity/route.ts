import { NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { computeActivityData } from "@/src/features/researcher/queries/activity";
import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const [papers, contracts] = await Promise.all([
    listUserPapers(wallet),
    listUserContracts(wallet),
  ]);
  const { pendingActions, activity } = computeActivityData(wallet, papers, contracts);
  return NextResponse.json({ pendingActions, activity });
}
