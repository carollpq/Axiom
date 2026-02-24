import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listUserContracts } from "@/features/contracts/queries";
import { createContract } from "@/features/contracts/actions";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await listUserContracts(wallet);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
