import { NextResponse } from 'next/server';
import { db } from '@/src/shared/lib/db';
import { badges } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';
import { HEDERA_NETWORK } from '@/src/shared/lib/hedera/network';

export const runtime = 'nodejs';

const HTS_TOKEN_ID = process.env.HTS_REPUTATION_TOKEN_ID;
const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'http://localhost:3000';

function hashscanUrl(path: string) {
  return `https://hashscan.io/${HEDERA_NETWORK}/${path}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const badge = await db.query.badges.findFirst({
    where: eq(badges.id, id),
  });

  if (!badge) {
    return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
  }

  const meta = (badge.metadata ?? {}) as Record<string, unknown>;

  const evidence: Array<Record<string, unknown>> = [];

  if (HTS_TOKEN_ID) {
    evidence.push({
      type: 'Evidence',
      id: hashscanUrl(`token/${HTS_TOKEN_ID}`),
      name: 'Hedera Token Service — Soulbound Reputation Token',
      description: `AXR soulbound reputation token on Hedera ${HEDERA_NETWORK}.`,
    });
  }

  if (meta.hederaTxId) {
    evidence.push({
      type: 'Evidence',
      id: hashscanUrl(`transaction/${meta.hederaTxId}`),
      name: 'Hedera Transaction',
      description: 'On-chain transaction recording this achievement.',
    });
  }

  // OpenBadges v3.0 (W3C Verifiable Credential) JSON-LD
  const credential = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: `${APP_DOMAIN}/api/badges/${badge.id}`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
      id: `${APP_DOMAIN}`,
      type: 'Profile',
      name: 'Axiom Academic Review',
      url: APP_DOMAIN,
      description: 'Blockchain-backed academic peer review platform on Hedera.',
    },
    issuanceDate: badge.issuedAt,
    credentialSubject: {
      type: 'AchievementSubject',
      achievement: {
        id: `${APP_DOMAIN}/api/badges/${badge.id}#achievement`,
        type: 'Achievement',
        name: badge.achievementName,
        description:
          meta.description ?? 'Academic peer review achievement on Axiom.',
        criteria: {
          narrative: `Awarded for: ${badge.achievementName}. Verified on Hedera blockchain.`,
        },
        ...(meta.reviewCount != null && {
          tag: [`reviewCount:${meta.reviewCount}`],
        }),
      },
    },
    ...(evidence.length > 0 && { evidence }),
  };

  return NextResponse.json(credential, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
