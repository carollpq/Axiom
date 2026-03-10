/**
 * Hedera Mirror Node client for reading on-chain state.
 * Uses plain fetch — no SDK needed. Defaults to testnet like client.ts.
 */

import { HEDERA_NETWORK } from './network';

const MIRROR_BASE_URL =
  HEDERA_NETWORK === 'mainnet'
    ? 'https://mainnet.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com';

export interface MirrorNft {
  token_id: string;
  serial_number: number;
  metadata: string; // base64 encoded
  created_timestamp: string;
}

export interface MirrorNftResponse {
  nfts: MirrorNft[];
  links?: { next?: string };
}

/**
 * Get NFTs held by an account, optionally filtered by token ID.
 * Queries treasury account since reputation tokens are minted there (Option A).
 * Note: limited to 100 results per call (Mirror Node default page size).
 */
export async function getAccountNfts(
  accountId: string,
  tokenId?: string,
): Promise<MirrorNft[] | null> {
  try {
    let url = `${MIRROR_BASE_URL}/api/v1/accounts/${accountId}/nfts`;
    const params = new URLSearchParams({ limit: '100' });
    if (tokenId) params.set('token.id', tokenId);
    url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Mirror] getAccountNfts ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as MirrorNftResponse;
    return data.nfts;
  } catch (err) {
    console.error('[Mirror] getAccountNfts failed:', err);
    return null;
  }
}

/**
 * Get metadata for a specific NFT serial.
 */
export async function getNftMetadata(
  tokenId: string,
  serial: number,
): Promise<MirrorNft | null> {
  try {
    const url = `${MIRROR_BASE_URL}/api/v1/tokens/${tokenId}/nfts/${serial}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    return (await res.json()) as MirrorNft;
  } catch (err) {
    console.error('[Mirror] getNftMetadata failed:', err);
    return null;
  }
}

/**
 * Decode base64-encoded NFT metadata to a JSON object.
 */
export function decodeNftMetadata(
  base64: string,
): Record<string, unknown> | null {
  try {
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Look up an account's Hedera account ID from an EVM address.
 */
export async function getAccountId(evmAddress: string): Promise<string | null> {
  try {
    const url = `${MIRROR_BASE_URL}/api/v1/accounts/${evmAddress}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as { account: string };
    return data.account;
  } catch (err) {
    console.error('[Mirror] getAccountId failed:', err);
    return null;
  }
}

/**
 * Get NFTs for the treasury/operator account filtered by token ID,
 * then filter by reviewer wallet in metadata (Option A approach).
 * Note: limited to first 100 treasury NFTs — sufficient for demo/testnet.
 */
export async function getReputationNftsForWallet(
  reviewerWallet: string,
): Promise<{ nfts: MirrorNft[]; decoded: Record<string, unknown>[] } | null> {
  const tokenId = process.env.HTS_REPUTATION_TOKEN_ID;
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  if (!tokenId || !operatorId) return null;

  const allNfts = await getAccountNfts(operatorId, tokenId);
  if (!allNfts) return null;

  const matching: MirrorNft[] = [];
  const decoded: Record<string, unknown>[] = [];

  for (const nft of allNfts) {
    const meta = decodeNftMetadata(nft.metadata);
    if (
      meta &&
      typeof meta.reviewerWallet === 'string' &&
      meta.reviewerWallet.toLowerCase() === reviewerWallet.toLowerCase()
    ) {
      matching.push(nft);
      decoded.push(meta);
    }
  }

  return { nfts: matching, decoded };
}
