import { NextResponse } from 'next/server';
import { getSession } from '@/src/shared/lib/auth/auth';
import type { ReputationEventTypeDb } from '@/src/shared/lib/db/schema';
import { mintReputationToken } from '@/src/shared/lib/hedera/hts';
import {
  createReputationEvent,
  upsertReputationScore,
} from '@/src/features/reviews/mutations';

/**
 * Auth guard — returns the lowercase wallet address or a 401 response.
 *
 * Usage:
 *   const session = await requireSession();
 *   if (session instanceof NextResponse) return session;
 *   // session is now `string` (wallet)
 */
export async function requireSession(): Promise<string | NextResponse> {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return wallet;
}

/**
 * Mint an HTS reputation token and create the corresponding reputation event.
 * Handles all error cases gracefully.
 */
export async function recordReputation(
  wallet: string,
  eventType: ReputationEventTypeDb,
  scoreDelta: number,
  details: string,
  mintMetadata: Record<string, unknown>,
): Promise<{ serial?: string; txId?: string }> {
  let serial: string | undefined;
  let txId: string | undefined;

  try {
    const result = await mintReputationToken(wallet, mintMetadata);
    serial = result?.serial;
    txId = result?.txId;
  } catch (err) {
    console.error('[HTS] Reputation token mint failed:', err);
  }

  await createReputationEvent({
    userWallet: wallet,
    eventType,
    scoreDelta,
    details,
    htsTokenSerial: serial,
    hederaTxId: txId,
  });

  // Recompute materialized reputation score
  try {
    await upsertReputationScore(wallet);
  } catch (err) {
    console.error('[Reputation] Score computation failed:', err);
  }

  return { serial, txId };
}
