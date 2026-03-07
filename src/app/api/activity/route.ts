import { NextResponse } from "next/server";
import { computeActivityData } from "@/src/features/researcher/queries/activity";
import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const [papers, contracts] = await Promise.all([
    listUserPapers(wallet),
    listUserContracts(wallet),
  ]);
  const { pendingActions, activity } = computeActivityData(wallet, papers, contracts);
  return NextResponse.json({ pendingActions, activity });
}
