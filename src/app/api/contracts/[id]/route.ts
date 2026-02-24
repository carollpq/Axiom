import { NextRequest, NextResponse } from "next/server";
import { getContractById } from "@/src/features/contracts/queries";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const contract = await getContractById(id);

  if (!contract) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(contract);
}
