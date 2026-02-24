import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addContributor, removeContributor } from "@/features/contracts/actions";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: contractId } = await params;
  const contributorId = req.nextUrl.searchParams.get("contributorId");
  if (!contributorId) {
    return NextResponse.json(
      { error: "contributorId param required" },
      { status: 400 },
    );
  }

  const deleted = await removeContributor(contractId, contributorId);
  if (!deleted) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
