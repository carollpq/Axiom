import { NextRequest, NextResponse } from "next/server";
import { signContributor } from "@/features/contracts";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { contributorWallet, signature, contractHash } = body as {
    contributorWallet?: string;
    signature?: string;
    contractHash?: string;
  };

  if (!contributorWallet || !signature) {
    return NextResponse.json(
      { error: "contributorWallet and signature are required" },
      { status: 400 },
    );
  }

  const result = signContributor({
    contractId: id,
    contributorWallet,
    signature,
    contractHash,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Contributor not found or wallet mismatch" },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
