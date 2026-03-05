import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContractById } from "@/src/features/contracts/queries";
import { signContributor, updateContractHedera } from "@/src/features/contracts/actions";
import { verifyMessage } from "viem";
import { requireSession, anchorToHcs, validationError } from "@/src/shared/lib/api-helpers";
import { EVM_ADDRESS_REGEX, HEX_SIGNATURE_REGEX } from "@/src/shared/lib/validation";

const signSchema = z.object({
  contributorWallet: z.string().regex(EVM_ADDRESS_REGEX, "Invalid wallet address"),
  signature: z.string().regex(HEX_SIGNATURE_REGEX, "Invalid signature format"),
  contractHash: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { contributorWallet, signature, contractHash } = parsed.data;

  if (contributorWallet.toLowerCase() !== session) {
    return NextResponse.json(
      { error: "Session wallet does not match contributor wallet" },
      { status: 403 },
    );
  }

  if (contractHash) {
    try {
      const isValid = await verifyMessage({
        address: contributorWallet as `0x${string}`,
        message: contractHash,
        signature: signature as `0x${string}`,
      });
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
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

  const contract = await getContractById(id) as unknown as {
    status: string;
    contractHash: string | null;
  } | null;
  const isFullySigned = contract?.status === "fully_signed";

  const hcsPayload = isFullySigned
    ? {
        type: "fullySigned",
        contractId: id,
        contractHash: contractHash ?? contract?.contractHash ?? null,
        timestamp: new Date().toISOString(),
      }
    : {
        type: "signed",
        contractId: id,
        contractHash: contractHash ?? null,
        signerWallet: contributorWallet,
        timestamp: new Date().toISOString(),
      };

  const { txId, consensusTimestamp } = await anchorToHcs(
    "HCS_TOPIC_CONTRACTS",
    hcsPayload,
  );

  if (isFullySigned && txId && consensusTimestamp) {
    await updateContractHedera(id, txId, consensusTimestamp);
  }

  return NextResponse.json(result);
}
