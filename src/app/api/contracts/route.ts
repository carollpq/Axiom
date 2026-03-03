import { NextRequest, NextResponse } from "next/server";
import { listUserContracts } from "@/src/features/contracts/queries";
import { createContract } from "@/src/features/contracts/actions";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const result = await listUserContracts(wallet);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const body = await req.json();
  const { paperTitle } = body;

  if (!paperTitle) {
    return NextResponse.json(
      { error: "paperTitle is required" },
      { status: 400 },
    );
  }

  const contract = await createContract({ ...body, wallet });
  if (!contract) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(contract, { status: 201 });
}
