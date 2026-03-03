import { NextRequest, NextResponse } from "next/server";
import { addContributor } from "@/src/features/contracts/actions";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id: contractId } = await params;
  const body = await req.json();
  const { contributorWallet, contributionPct } = body;

  if (!contributorWallet || contributionPct == null) {
    return NextResponse.json(
      { error: "contributorWallet and contributionPct are required" },
      { status: 400 },
    );
  }

  const contributor = await addContributor({ ...body, contractId });
  return NextResponse.json(contributor, { status: 201 });
}

