import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/shared/lib/db';
import { reputationScores, reputationEvents } from '@/src/shared/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getReputationNftsForWallet } from '@/src/shared/lib/hedera/mirror';

export const runtime = 'nodejs';

/**
 * Public reputation verification endpoint.
 * Intentionally unauthenticated — reputation is public by design.
 */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json(
      { error: 'wallet query param is required' },
      { status: 400 },
    );
  }

  const normalizedWallet = wallet.toLowerCase();

  // Run all three independent fetches in parallel
  const [dbScore, recentEvents, mirrorData] = await Promise.all([
    db.query.reputationScores.findFirst({
      where: eq(reputationScores.userWallet, normalizedWallet),
    }),
    db
      .select()
      .from(reputationEvents)
      .where(eq(reputationEvents.userWallet, normalizedWallet))
      .orderBy(desc(reputationEvents.createdAt))
      .limit(50),
    getReputationNftsForWallet(normalizedWallet).catch((err) => {
      console.error('[Reputation API] Mirror Node lookup failed:', err);
      return null;
    }),
  ]);

  const onChain = mirrorData
    ? {
        tokenCount: mirrorData.nfts.length,
        recentSerials: mirrorData.nfts.slice(0, 20).map((n) => n.serial_number),
      }
    : null;

  return NextResponse.json({
    wallet: normalizedWallet,
    dbScore: dbScore ?? null,
    recentEvents,
    onChain,
  });
}
