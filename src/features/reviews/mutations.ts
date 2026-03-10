import { db } from '@/src/shared/lib/db';
import {
  reviews,
  reviewAssignments,
  reviewCriteria,
  submissions,
  reputationEvents,
  reputationScores,
} from '@/src/shared/lib/db/schema';
import type { ReputationEventTypeDb } from '@/src/shared/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { mintReputationToken } from '@/src/shared/lib/hedera/hts';

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

export interface PublishCriteriaInput {
  submissionId: string;
  criteriaJson: string;
  criteriaHash: string;
  hederaTxId?: string;
}

export async function publishCriteria(input: PublishCriteriaInput) {
  const criteria =
    (
      await db
        .insert(reviewCriteria)
        .values({
          submissionId: input.submissionId,
          criteriaJson: input.criteriaJson,
          criteriaHash: input.criteriaHash,
          hederaTxId: input.hederaTxId ?? null,
        })
        .returning()
    )[0] ?? null;

  if (criteria) {
    await db
      .update(submissions)
      .set({
        status: 'criteria_published',
        criteriaHash: input.criteriaHash,
        criteriaTxId: input.hederaTxId ?? null,
      })
      .where(eq(submissions.id, input.submissionId));
  }

  return criteria;
}

export async function markAssignmentLate(assignmentId: string) {
  return (
    (
      await db
        .update(reviewAssignments)
        .set({ status: 'late' })
        .where(eq(reviewAssignments.id, assignmentId))
        .returning()
    )[0] ?? null
  );
}

export interface CreateAssignmentInput {
  submissionId: string;
  reviewerWallet: string;
  deadline: string;
}

export async function createReviewAssignment(input: CreateAssignmentInput) {
  return (
    (
      await db
        .insert(reviewAssignments)
        .values({
          submissionId: input.submissionId,
          reviewerWallet: input.reviewerWallet.toLowerCase(),
          deadline: input.deadline,
          status: 'assigned',
        })
        .returning()
    )[0] ?? null
  );
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: string,
  extra?: Record<string, string | null>,
) {
  return (
    (
      await db
        .update(submissions)
        .set({ status: status as never, ...extra })
        .where(eq(submissions.id, submissionId))
        .returning()
    )[0] ?? null
  );
}

export async function createReputationEvent(input: {
  userWallet: string;
  eventType: string;
  scoreDelta: number;
  details?: string;
  htsTokenSerial?: string;
  hederaTxId?: string;
}) {
  return (
    (
      await db
        .insert(reputationEvents)
        .values({
          userWallet: input.userWallet.toLowerCase(),
          eventType: input.eventType as never,
          scoreDelta: input.scoreDelta,
          details: input.details ?? null,
          htsTokenSerial: input.htsTokenSerial ?? null,
          hederaTxId: input.hederaTxId ?? null,
        })
        .returning()
    )[0] ?? null
  );
}

export async function updateAssignmentTimelineIndex(
  assignmentId: string,
  index: number,
) {
  return (
    (
      await db
        .update(reviewAssignments)
        .set({ timelineEnforcerIndex: index })
        .where(eq(reviewAssignments.id, assignmentId))
        .returning()
    )[0] ?? null
  );
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
const PUBLICATION_TYPES = ['paper_published', 'paper_retracted'];

/**
 * Compute and upsert the reputation score for a reviewer wallet.
 * Weighted formula: 0.30 timeliness + 0.25 editor + 0.25 author + 0.20 publication
 * Uses SQL aggregation (GROUP BY event_type) — returns at most ~8 rows regardless of event count.
 */
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
