import { NextRequest, NextResponse } from "next/server";
import { listUserContracts, createContract } from "@/features/contracts";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet param required" }, { status: 400 });
  }

  const result = listUserContracts(wallet);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { paperTitle, wallet } = body;

  if (!paperTitle || !wallet) {
    return NextResponse.json(
      { error: "paperTitle and wallet are required" },
      { status: 400 },
    );
  }

  const contract = createContract(body);
  if (!contract) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(contract, { status: 201 });
}
