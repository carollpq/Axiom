import { NextRequest, NextResponse } from "next/server";
import { signContributor, updateContractHedera, getContractById } from "@/features/contracts";
import { isHederaConfigured } from "@/lib/hedera/client";
import { submitHcsMessage } from "@/lib/hedera/hcs";

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

  // Anchor on Hedera HCS — skipped gracefully if credentials are not configured
  if (isHederaConfigured() && process.env.HCS_TOPIC_CONTRACTS) {
    try {
      // Re-fetch contract to check final status after the sign
      const contract = getContractById(id) as unknown as {
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

      // Store HCS receipt on the contract (only on fully-signed — the definitive event)
      if (isFullySigned) {
        updateContractHedera(id, txId, consensusTimestamp);
      }
    } catch (err) {
      // HCS failure is non-fatal
      console.error("[HCS] Contract sign failed:", err);
    }
  }

  return NextResponse.json(result);
}
