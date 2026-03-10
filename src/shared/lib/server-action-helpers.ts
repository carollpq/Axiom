'use server';

import { getSession } from '@/src/shared/lib/auth/auth';
import { db } from '@/src/shared/lib/db';
import {
  submissions,
  reviews,
  rebuttals,
  journals,
} from '@/src/shared/lib/db/schema';
import type {
  NotificationTypeDb,
  ReputationEventTypeDb,
} from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isHederaConfigured } from '@/src/shared/lib/hedera/client';
import { submitHcsMessage } from '@/src/shared/lib/hedera/hcs';
import { mintReputationToken } from '@/src/shared/lib/hedera/hts';
import {
  createReputationEvent,
  upsertReputationScore,
} from '@/src/features/reviews/mutations';
import { createNotification } from '@/src/features/notifications/mutations';
import { getRebuttalById } from '@/src/features/rebuttals/queries';

/**
 * Auth guard for server actions — throws on failure instead of returning NextResponse.
 */
export async function requireAuth(): Promise<string> {
  const wallet = await getSession();
  if (!wallet) {
    throw new Error('Unauthorized');
  }
  return wallet;
}

type HcsTopicEnvVar =
  | 'HCS_TOPIC_PAPERS'
  | 'HCS_TOPIC_CONTRACTS'
  | 'HCS_TOPIC_SUBMISSIONS'
  | 'HCS_TOPIC_CRITERIA'
  | 'HCS_TOPIC_REVIEWS'
  | 'HCS_TOPIC_DECISIONS'
  | 'HCS_TOPIC_RETRACTIONS';

/**
 * Anchor a JSON payload to an HCS topic with graceful fallback.
 */
export async function anchorToHcs(
  topicEnvVar: HcsTopicEnvVar,
  payload: Record<string, unknown>,
  label = 'HCS',
): Promise<{ txId?: string; consensusTimestamp?: string }> {
  const topicId = process.env[topicEnvVar];
  if (!isHederaConfigured() || !topicId) return {};

  try {
    const { txId, consensusTimestamp } = await submitHcsMessage(
      topicId,
      payload,
    );
    return { txId, consensusTimestamp };
  } catch (err) {
    console.error(`[${label}] Anchor failed:`, err);
    return {};
  }
}

/**
 * Mint an HTS reputation token and create the corresponding reputation event.
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

  try {
    await upsertReputationScore(wallet);
  } catch (err) {
    console.error('[Reputation] Score computation failed:', err);
  }

  return { serial, txId };
}

/**
 * Journal editor guard for server actions.
 */
export async function requireJournalEditor(journalId: string, wallet: string) {
  const journal = await db.query.journals.findFirst({
    where: eq(journals.id, journalId),
  });

  if (!journal) throw new Error('Journal not found');
  if (journal.editorWallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error('Forbidden');
  }

  return journal;
}

/**
 * Editor ownership check for server actions.
 */
export async function requireSubmissionEditor(
  submissionId: string,
  wallet: string,
) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { journal: true, paper: { with: { owner: true } } },
  });

  if (!submission) throw new Error('Submission not found');
  if (submission.journal.editorWallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error('Forbidden');
  }

  return submission;
}

/**
 * Rebuttal author guard for server actions.
 */
export async function requireRebuttalAuthor(
  rebuttalId: string,
  wallet: string,
) {
  const rebuttal = await db.query.rebuttals.findFirst({
    where: eq(rebuttals.id, rebuttalId),
    with: {
      submission: {
        with: {
          paper: { with: { owner: true } },
          journal: true,
        },
      },
    },
  });

  if (!rebuttal) throw new Error('Rebuttal not found');
  if (rebuttal.authorWallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error('Forbidden');
  }

  return rebuttal;
}

/**
 * Rebuttal editor guard for server actions.
 */
export async function requireRebuttalEditor(
  rebuttalId: string,
  wallet: string,
) {
  const rebuttal = await getRebuttalById(rebuttalId);

  if (!rebuttal) throw new Error('Rebuttal not found');
  if (!rebuttal.submission?.journal) throw new Error('Submission not found');
  if (
    rebuttal.submission.journal.editorWallet.toLowerCase() !==
    wallet.toLowerCase()
  ) {
    throw new Error('Forbidden');
  }

  return rebuttal;
}

/**
 * Review + paper owner guard for server actions.
 */
export async function requireReviewWithPaperOwner(
  reviewId: string,
  wallet: string,
) {
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
    with: {
      submission: {
        with: { paper: { with: { owner: true } } },
      },
    },
  });

  if (!review) throw new Error('Review not found');
  if (
    review.submission.paper.owner.walletAddress.toLowerCase() !==
    wallet.toLowerCase()
  ) {
    throw new Error('Forbidden');
  }

  return review;
}

/**
 * Anchor a payload to HCS and fire notifications in parallel.
 */
export async function anchorAndNotify(opts: {
  topic: HcsTopicEnvVar;
  payload: Record<string, unknown>;
  notifications: Array<{
    userWallet: string;
    type: NotificationTypeDb;
    title: string;
    body: string;
    link?: string;
  }>;
}): Promise<{ txId?: string; consensusTimestamp?: string }> {
  const [hcsResult] = await Promise.all([
    anchorToHcs(opts.topic, opts.payload),
    ...opts.notifications.map((n) => createNotification(n)),
  ]);

  return hcsResult;
}
