import { NextRequest, NextResponse } from "next/server";
import { getContractById } from "@/src/features/contracts/queries";
import { resetContractSignatures } from "@/src/features/contracts/actions";
import { getUserByWallet } from "@/src/features/users/queries";
import { requireSession } from "@/src/shared/lib/api-helpers";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await requireSession();
  if (sessionWallet instanceof NextResponse) return sessionWallet;

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
