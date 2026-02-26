import { TokenMintTransaction, TokenId } from "@hashgraph/sdk";
import { getHederaClient } from "./client";

export interface MintResult {
  serial: string;
  txId: string;
}

/**
 * Mint a soulbound reputation NFT for a reviewer.
 * Returns null (with a warning) if HTS_REPUTATION_TOKEN_ID is not configured.
 * Metadata is stored as UTF-8 encoded JSON bytes.
 */
export async function mintReputationToken(
  reviewerWallet: string,
  metadata: Record<string, unknown>,
): Promise<MintResult | null> {
  if (!process.env.HTS_REPUTATION_TOKEN_ID) {
    console.warn("[HTS] HTS_REPUTATION_TOKEN_ID not set — skipping reputation token mint");
    return null;
  }

  try {
    const client = getHederaClient();
    const tokenId = TokenId.fromString(process.env.HTS_REPUTATION_TOKEN_ID);

    const metadataBytes = Buffer.from(
      JSON.stringify({ reviewerWallet: reviewerWallet.toLowerCase(), ...metadata }),
    );

    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .addMetadata(metadataBytes)
      .execute(client);

    const receipt = await mintTx.getReceipt(client);
    const serials = receipt.serials;
    const serial = serials.length > 0 ? serials[0].toString() : "0";
    const txId = mintTx.transactionId.toString();

    return { serial, txId };
  } catch (err) {
    console.error("[HTS] Reputation token mint failed:", err);
    return null;
  }
}
