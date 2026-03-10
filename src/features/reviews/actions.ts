'use server';

import { z } from 'zod';
import { after } from 'next/server';
import { db } from '@/src/shared/lib/db';
import { paperVersions, reviewerRatings } from '@/src/shared/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { canonicalJson, sha256 } from '@/src/shared/lib/hashing';
import {
  requireAuth,
  requireReviewWithPaperOwner,
  anchorAndNotify,
  anchorToHcs,
  recordReputation,
} from '@/src/shared/lib/server-action-helpers';
import { ROUTES } from '@/src/shared/lib/routes';
import {
  getReviewAssignment,
  listReviewAssignmentsForSubmission,
} from '@/src/features/reviews/queries';
import {
  createReview,
  updateReviewHedera,
  updateSubmissionStatus,
} from '@/src/features/reviews/mutations';
import { createNotification } from '@/src/features/notifications/mutations';
import { markDeadlineCompleted } from '@/src/shared/lib/hedera/timeline-enforcer';

// ---------------------------------------------------------------------------
// Submit Review
// ---------------------------------------------------------------------------

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
  const session = await requireAuth();

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
    criteriaEvaluations: JSON.stringify(input.criteriaEvaluations),
    strengths: input.strengths ?? '',
    weaknesses: input.weaknesses ?? '',
    questionsForAuthors: input.questionsForAuthors ?? '',
    confidentialEditorComments: input.confidentialEditorComments ?? '',
    recommendation: input.recommendation,
  });

  if (!review) throw new Error('Failed to create review');

  const editorWallet = assignment.submission.journal?.editorWallet;

  after(async () => {
    const { txId: hederaTxId } = await anchorAndNotify({
      topic: 'HCS_TOPIC_REVIEWS',
      payload: {
        type: 'review_submitted',
        reviewHash: input.reviewHash,
        reviewerWallet: session,
        submissionId: assignment.submissionId,
        paperHash: latestVersion?.paperHash ?? null,
        timestamp: new Date().toISOString(),
      },
      notifications: editorWallet
        ? [
            {
              userWallet: editorWallet,
              type: 'review_submitted',
              title: 'Review submitted',
              body: `A reviewer has submitted their review for "${assignment.submission.paper.title}".`,
              link: ROUTES.editor.underReview,
            },
          ]
        : [],
    });

    if (hederaTxId) {
      await updateReviewHedera(review.id, hederaTxId);
    }

    await recordReputation(
      session,
      'review_completed',
      1,
      JSON.stringify({
        reviewId: review.id,
        submissionId: assignment.submissionId,
      }),
      {
        type: 'review_completed',
        reviewId: review.id,
        submissionId: assignment.submissionId,
      },
    );

    if (assignment.timelineEnforcerIndex != null) {
      await markDeadlineCompleted(
        assignment.submissionId,
        assignment.timelineEnforcerIndex,
      );
    }

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

  return { reviewId: review.id };
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

export async function rateReviewerAction(
  reviewId: string,
  input: z.infer<typeof ratingSchema>,
) {
  const session = await requireAuth();

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
