import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getContractById } from "@/features/contracts/queries";
import { signContributor, updateContractHedera } from "@/features/contracts/actions";
import { isHederaConfigured } from "@/lib/hedera/client";
import { submitHcsMessage } from "@/lib/hedera/hcs";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (contributorWallet.toLowerCase() !== sessionWallet) {
    return NextResponse.json(
      { error: "Session wallet does not match contributor wallet" },
      { status: 403 },
    );
  }

  const result = await signContributor({
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

  if (isHederaConfigured() && process.env.HCS_TOPIC_CONTRACTS) {
    try {
      const contract = await getContractById(id) as unknown as {
        status: string;
        contractHash: string | null;
      } | null;
      const isFullySigned = contract?.status === "fully_signed";

      const hcsPayload = isFullySigned
        ? {
            type: "fullySigned",
            contractId: id,
            contractHash: contractHash ?? contract?.contractHash,
            timestamp: new Date().toISOString(),
          }
        : {
            type: "signed",
            contractId: id,
            contractHash: contractHash ?? null,
            signerWallet: contributorWallet,
            timestamp: new Date().toISOString(),
          };

      const { txId, consensusTimestamp } = await submitHcsMessage(
        process.env.HCS_TOPIC_CONTRACTS,
        hcsPayload,
      );

      if (isFullySigned) {
        await updateContractHedera(id, txId, consensusTimestamp);
      }
    } catch (err) {
      console.error("[HCS] Contract sign failed:", err);
    }
  }

  return NextResponse.json(result);
}
