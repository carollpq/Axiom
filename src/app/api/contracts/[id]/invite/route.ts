import { NextRequest, NextResponse } from "next/server";
import { getContractById } from "@/src/features/contracts/queries";
import { generateInviteToken } from "@/src/features/contracts/actions";
import { getUserByWallet } from "@/src/features/users/queries";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await requireSession();
  if (sessionWallet instanceof NextResponse) return sessionWallet;

  const { id } = await params;
  const body = await req.json();
  const { contributorId } = body as { contributorId?: string };

  if (!contributorId) {
    return NextResponse.json({ error: "contributorId is required" }, { status: 400 });
  }

  const contract = await getContractById(id);
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const user = await getUserByWallet(sessionWallet);
  if (!user || contract.creatorId !== user.id) {
    return NextResponse.json({ error: "Only the contract creator can generate invite links" }, { status: 403 });
  }

  const result = await generateInviteToken(id, contributorId);
  if (!result) {
    return NextResponse.json({ error: "Contributor not found" }, { status: 404 });
  }

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const inviteLink = `${protocol}://${domain}/invite/${result.token}`;

  return NextResponse.json({ inviteLink, expiresAt: result.expiresAt });
}
