'use server';

import { z } from 'zod';
import { after } from 'next/server';
import { db } from '@/src/shared/lib/db';
import { paperVersions, reviewerRatings } from '@/src/shared/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { canonicalJson, sha256 } from '@/src/shared/lib/hashing';
import { requireSession } from '@/src/shared/lib/auth/auth';
import { anchorToHcs } from '@/src/shared/lib/hedera/hcs';
import {
  requireReviewWithPaperOwner,
  getReviewAssignment,
  listReviewAssignmentsForSubmission,
} from '@/src/features/reviews/queries';
import { ROUTES } from '@/src/shared/lib/routes';
import {
  createReview,
  updateReviewHedera,
  recordReputation,
} from '@/src/features/reviews/mutations';
import { updateSubmissionStatus } from '@/src/features/submissions/mutations';
import {
  createNotification,
  notifyIfWallet,
} from '@/src/features/notifications/mutations';
import { markDeadlineCompleted } from '@/src/shared/lib/hedera/timeline-enforcer';

// ---------------------------------------------------------------------------
// Submit Review
// ---------------------------------------------------------------------------

// TODO: Derive enum values from DB types to maintain a single source of truth
const submitReviewSchema = z.object({
  criteriaEvaluations: z.record(z.string(), z.unknown()),
  strengths: z.string().max(10000),
  weaknesses: z.string().max(10000),
  questionsForAuthors: z.string().max(10000),
  confidentialEditorComments: z.string().max(10000),
  recommendation: z.enum([
    'accept',
    'minor_revision',
    'major_revision',
    'reject',
  ]),
  reviewHash: z.string(),
});

/** Creates review, marks assignment submitted, mints reputation token.
 *  Auto-transitions to `reviews_completed` when all active reviewers are done. */
export async function submitReviewAction(
  assignmentId: string,
  input: {
    criteriaEvaluations: Record<string, unknown>;
    strengths: string;
    weaknesses: string;
    questionsForAuthors: string;
    confidentialEditorComments: string;
    recommendation: string;
    reviewHash: string;
  },
) {
  const session = await requireSession();
  submitReviewSchema.parse(input);

  const assignment = await getReviewAssignment(assignmentId, session);
  if (!assignment) {
    throw new Error('Assignment not found or access denied');
  }

  if (assignment.status === 'submitted') {
    throw new Error('Review already submitted');
  }
  if (assignment.status === 'declined') {
    throw new Error('Assignment was declined');
  }

  if (!input.recommendation || !input.reviewHash) {
    throw new Error('recommendation and reviewHash are required');
  }

  const latestVersion = await db
    .select()
    .from(paperVersions)
    .where(eq(paperVersions.paperId, assignment.submission.paperId))
    .orderBy(desc(paperVersions.versionNumber))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const review = await createReview({
    submissionId: assignment.submissionId,
    assignmentId,
    reviewerWallet: session,
    reviewHash: input.reviewHash,
    criteriaEvaluations: canonicalJson(input.criteriaEvaluations),
    strengths: input.strengths,
    weaknesses: input.weaknesses,
    questionsForAuthors: input.questionsForAuthors,
    confidentialEditorComments: input.confidentialEditorComments,
    recommendation: input.recommendation,
  });

  if (!review) throw new Error('Failed to create review');

  const editorWallet = assignment.submission.journal?.editorWallet;

  // Anchor to HCS inline so we can return the txId to the client
  const { txId: hederaTxId } = await anchorToHcs('HCS_TOPIC_REVIEWS', {
    type: 'review_submitted',
    reviewHash: input.reviewHash,
    reviewerWallet: session,
    submissionId: assignment.submissionId,
    paperHash: latestVersion?.paperHash ?? null,
    timestamp: new Date().toISOString(),
  });

  if (hederaTxId) {
    await updateReviewHedera(review.id, hederaTxId);
  }

  after(async () => {
    await Promise.all([
      notifyIfWallet(editorWallet, {
        type: 'review_submitted',
        title: 'Review submitted',
        body: `A reviewer has submitted their review for "${assignment.submission.paper.title}".`,
        link: ROUTES.editor.underReview,
      }),
      recordReputation(
        session,
        'review_completed',
        1,
        canonicalJson({
          reviewId: review.id,
          submissionId: assignment.submissionId,
        }),
        {
          type: 'review_completed',
          reviewId: review.id,
          submissionId: assignment.submissionId,
        },
      ),
      assignment.timelineEnforcerIndex != null
        ? markDeadlineCompleted(
            assignment.submissionId,
            assignment.timelineEnforcerIndex,
          )
        : Promise.resolve(),
    ]);

    const allAssignments = await listReviewAssignmentsForSubmission(
      assignment.submissionId,
    );
    const activeAssignments = allAssignments.filter(
      (a) => a.status !== 'declined',
    );
    const allSubmitted =
      activeAssignments.length > 0 &&
      activeAssignments.every((a) => a.status === 'submitted');

    if (allSubmitted && assignment.submission.paper.owner?.walletAddress) {
      await updateSubmissionStatus(
        assignment.submissionId,
        'reviews_completed',
      );

      await createNotification({
        userWallet: assignment.submission.paper.owner.walletAddress,
        type: 'reviews_completed',
        title: 'All reviews complete',
        body: `All reviews are complete for "${assignment.submission.paper.title}". Please review and respond.`,
        link: ROUTES.researcher.viewSubmissions,
      });
    }
  });

  return { reviewId: review.id, hederaTxId: hederaTxId ?? null };
}

// ---------------------------------------------------------------------------
// Rate Reviewer
// ---------------------------------------------------------------------------

const ratingSchema = z.object({
  actionableFeedback: z.number().int().min(1).max(5),
  deepEngagement: z.number().int().min(1).max(5),
  fairObjective: z.number().int().min(1).max(5),
  justifiedRecommendation: z.number().int().min(1).max(5),
  appropriateExpertise: z.number().int().min(1).max(5),
  comment: z.string().trim().max(10_000).nullish(),
});

const PROTOCOL_KEYS = [
  'actionableFeedback',
  'deepEngagement',
  'fairObjective',
  'justifiedRecommendation',
  'appropriateExpertise',
] as const;

/** Anonymous 5-protocol rating by the paper author. Idempotent (skips if already rated). */
export async function rateReviewerAction(
  reviewId: string,
  input: z.infer<typeof ratingSchema>,
) {
  const session = await requireSession();

  const review = await requireReviewWithPaperOwner(reviewId, session);
  const parsed = ratingSchema.parse(input);

  const {
    actionableFeedback,
    deepEngagement,
    fairObjective,
    justifiedRecommendation,
    appropriateExpertise,
    comment,
  } = parsed;

  // Check if already rated
  const existing = await db.query.reviewerRatings.findFirst({
    where: eq(reviewerRatings.reviewId, reviewId),
  });
  if (existing) {
    return { alreadyRated: true };
  }

  const overallRating = Math.round(
    PROTOCOL_KEYS.reduce((sum, k) => sum + parsed[k], 0) / PROTOCOL_KEYS.length,
  );

  const ratingHash = await sha256(
    canonicalJson({
      reviewId,
      actionableFeedback,
      deepEngagement,
      fairObjective,
      justifiedRecommendation,
      appropriateExpertise,
    }),
  );

  let commentHash: string | null = null;
  if (comment?.trim()) {
    commentHash = await sha256(canonicalJson({ comment, reviewId }));
  }

  // Critical DB write — must complete before returning
  const [ratingRow] = await db
    .insert(reviewerRatings)
    .values({
      reviewId,
      actionableFeedback,
      deepEngagement,
      fairObjective,
      justifiedRecommendation,
      appropriateExpertise,
      overallRating,
      comment: comment?.trim() || null,
      commentHash,
      ratingHash,
      reputationTokenSerial: null,
    })
    .returning();

  // Non-blocking: HCS anchoring + reputation minting
  after(async () => {
    if (commentHash) {
      await anchorToHcs('HCS_TOPIC_REVIEWS', {
        type: 'author_comment',
        reviewId,
        commentHash,
        timestamp: new Date().toISOString(),
      });
    }

    const { serial } = await recordReputation(
      review.reviewerWallet,
      'author_rating',
      overallRating - 3,
      `Author rating: ${overallRating}/5`,
      {
        type: 'author_rating',
        protocols: {
          actionable_feedback: actionableFeedback,
          deep_engagement: deepEngagement,
          fair_objective: fairObjective,
          justified_recommendation: justifiedRecommendation,
          appropriate_expertise: appropriateExpertise,
        },
        overall: overallRating,
        reviewId,
      },
    );

    if (serial && ratingRow) {
      await db
        .update(reviewerRatings)
        .set({ reputationTokenSerial: serial })
        .where(eq(reviewerRatings.id, ratingRow.id));
    }
  });

  return {
    alreadyRated: false,
    ratingId: ratingRow?.id,
    overallRating,
  };
}
