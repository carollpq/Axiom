import { db } from '@/src/shared/lib/db';
import {
  reviews,
  reviewAssignments,
  reputationEvents,
  reputationScores,
  type ReputationEventTypeDb,
} from '@/src/shared/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { mintReputationToken } from '@/src/shared/lib/hedera/hts';
import { checkAndIssueBadges } from '@/src/features/reviewer/lib/badge-definitions';

export interface CreateReviewInput {
  submissionId: string;
  assignmentId: string;
  reviewerWallet: string;
  reviewHash: string;
  criteriaEvaluations: string; // JSON string
  strengths: string;
  weaknesses: string;
  questionsForAuthors: string;
  confidentialEditorComments: string;
  recommendation: string;
}

/** Inserts review and marks the assignment as `submitted`. */
export async function createReview(input: CreateReviewInput) {
  const review =
    (
      await db
        .insert(reviews)
        .values({
          submissionId: input.submissionId,
          assignmentId: input.assignmentId,
          reviewerWallet: input.reviewerWallet.toLowerCase(),
          reviewHash: input.reviewHash,
          criteriaEvaluations: input.criteriaEvaluations,
          strengths: input.strengths,
          weaknesses: input.weaknesses,
          questionsForAuthors: input.questionsForAuthors,
          confidentialEditorComments: input.confidentialEditorComments,
          recommendation: input.recommendation,
        })
        .returning()
    )[0] ?? null;

  if (review) {
    await db
      .update(reviewAssignments)
      .set({ status: 'submitted', submittedAt: new Date().toISOString() })
      .where(eq(reviewAssignments.id, input.assignmentId));
  }

  return review;
}

export async function updateReviewHedera(reviewId: string, hederaTxId: string) {
  return (
    (
      await db
        .update(reviews)
        .set({ hederaTxId })
        .where(eq(reviews.id, reviewId))
        .returning()
    )[0] ?? null
  );
}

export async function markAssignmentLate(assignmentId: string) {
  await db
    .update(reviewAssignments)
    .set({ status: 'late' })
    .where(eq(reviewAssignments.id, assignmentId));
}

// Bucket mapping: which event types feed which score dimension.
// Rebuttal outcomes affect the editor/quality dimension since they reflect review quality.
const TIMELINESS_TYPES = ['review_completed', 'review_late'];
const EDITOR_TYPES = [
  'editor_rating',
  'rebuttal_upheld',
  'rebuttal_overturned',
];
const AUTHOR_TYPES = ['author_rating'];
const PUBLICATION_TYPES = ['paper_published'];

/** Recomputes weighted reputation score via SQL aggregation and upserts it. */
export async function upsertReputationScore(wallet: string) {
  const normalizedWallet = wallet.toLowerCase();

  // Aggregate in SQL instead of fetching all rows
  const aggregated = await db
    .select({
      eventType: reputationEvents.eventType,
      sumDelta: sql<number>`cast(sum(${reputationEvents.scoreDelta}) as int)`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(reputationEvents)
    .where(eq(reputationEvents.userWallet, normalizedWallet))
    .groupBy(reputationEvents.eventType);

  if (aggregated.length === 0) return null;

  let timelinessSum = 0,
    timelinessCount = 0;
  let editorSum = 0,
    editorCount = 0;
  let authorSum = 0,
    authorCount = 0;
  let pubSum = 0,
    pubCount = 0;
  let reviewCount = 0;

  for (const row of aggregated) {
    if (TIMELINESS_TYPES.includes(row.eventType)) {
      timelinessSum += row.sumDelta;
      timelinessCount += row.count;
      if (row.eventType === 'review_completed') reviewCount += row.count;
    } else if (EDITOR_TYPES.includes(row.eventType)) {
      editorSum += row.sumDelta;
      editorCount += row.count;
    } else if (AUTHOR_TYPES.includes(row.eventType)) {
      authorSum += row.sumDelta;
      authorCount += row.count;
    } else if (PUBLICATION_TYPES.includes(row.eventType)) {
      pubSum += row.sumDelta;
      pubCount += row.count;
    }
  }

  const norm = (sum: number, count: number) =>
    count === 0
      ? 50
      : Math.max(0, Math.min(100, Math.round((sum / count) * 50 + 50)));

  const timeliness = norm(timelinessSum, timelinessCount);
  const editor = norm(editorSum, editorCount);
  const author = norm(authorSum, authorCount);
  const publication = norm(pubSum, pubCount);

  const overall = Math.round(
    0.3 * timeliness + 0.25 * editor + 0.25 * author + 0.2 * publication,
  );

  await db
    .insert(reputationScores)
    .values({
      userWallet: normalizedWallet,
      overallScore: overall,
      timelinessScore: timeliness,
      editorRatingAvg: editor,
      authorRatingAvg: author,
      publicationScore: publication,
      reviewCount,
      lastComputedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: reputationScores.userWallet,
      set: {
        overallScore: sql`excluded.overall_score`,
        timelinessScore: sql`excluded.timeliness_score`,
        editorRatingAvg: sql`excluded.editor_rating_avg`,
        authorRatingAvg: sql`excluded.author_rating_avg`,
        publicationScore: sql`excluded.publication_score`,
        reviewCount: sql`excluded.review_count`,
        lastComputedAt: sql`excluded.last_computed_at`,
      },
    });

  return {
    overallScore: overall,
    timeliness,
    editor,
    author,
    publication,
    reviewCount,
  };
}

/** Mints HTS soulbound token, logs reputation event, recomputes score. */
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

  await db.insert(reputationEvents).values({
    userWallet: wallet.toLowerCase(),
    eventType,
    scoreDelta,
    details,
    htsTokenSerial: serial ?? null,
    hederaTxId: txId ?? null,
  });

  try {
    await upsertReputationScore(wallet);
  } catch (err) {
    console.error('[Reputation] Score computation failed:', err);
  }

  try {
    await checkAndIssueBadges(wallet);
  } catch (err) {
    console.error('[Badges] Badge issuance check failed:', err);
  }

  return { serial, txId };
}
