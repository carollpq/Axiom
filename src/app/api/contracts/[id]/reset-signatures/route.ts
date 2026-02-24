import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getContractById } from "@/src/features/contracts/queries";
import { resetContractSignatures } from "@/src/features/contracts/actions";
import { getUserByWallet } from "@/src/features/users/queries";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const contract = await getContractById(id);
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const user = await getUserByWallet(sessionWallet);
  if (!user || contract.creatorId !== user.id) {
    return NextResponse.json({ error: "Only the contract creator can reset signatures" }, { status: 403 });
  }

  const updated = await resetContractSignatures(id);
  if (!updated) {
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
