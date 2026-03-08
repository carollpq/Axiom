import { NextRequest, NextResponse, after } from 'next/server';
import {
  getReviewAssignment,
  listReviewAssignmentsForSubmission,
} from '@/src/features/reviews/queries';
import {
  createReview,
  updateReviewHedera,
  updateSubmissionStatus,
} from '@/src/features/reviews/actions';
import { createNotification } from '@/src/features/notifications/actions';
import { db } from '@/src/shared/lib/db';
import { paperVersions } from '@/src/shared/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  requireSession,
  anchorAndNotify,
  recordReputation,
} from '@/src/shared/lib/api-helpers';
import { markDeadlineCompleted } from '@/src/shared/lib/hedera/timeline-enforcer';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: assignmentId } = await params;

  const assignment = await getReviewAssignment(assignmentId, session);
  if (!assignment) {
    return NextResponse.json(
      { error: 'Assignment not found or access denied' },
      { status: 403 },
    );
  }

  if (assignment.status === 'submitted') {
    return NextResponse.json(
      { error: 'Review already submitted' },
      { status: 400 },
    );
  }

  if (assignment.status === 'declined') {
    return NextResponse.json(
      { error: 'Assignment was declined' },
      { status: 400 },
    );
  }

  const body = (await req.json()) as {
    criteriaEvaluations: Record<string, unknown>;
    strengths: string;
    weaknesses: string;
    questionsForAuthors: string;
    confidentialEditorComments: string;
    recommendation: string;
    reviewHash: string;
  };

  if (!body.recommendation || !body.reviewHash) {
    return NextResponse.json(
      { error: 'recommendation and reviewHash are required' },
      { status: 400 },
    );
  }

  // Get latest paper version hash for HCS message
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
    reviewHash: body.reviewHash,
    criteriaEvaluations: JSON.stringify(body.criteriaEvaluations),
    strengths: body.strengths ?? '',
    weaknesses: body.weaknesses ?? '',
    questionsForAuthors: body.questionsForAuthors ?? '',
    confidentialEditorComments: body.confidentialEditorComments ?? '',
    recommendation: body.recommendation,
  });

  if (!review) {
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 },
    );
  }

  const editorWallet = assignment.submission.journal?.editorWallet;

  // Non-blocking: HCS anchoring, reputation, and status transition run after response
  after(async () => {
    const { txId: hederaTxId } = await anchorAndNotify({
      topic: 'HCS_TOPIC_REVIEWS',
      payload: {
        type: 'review_submitted',
        reviewHash: body.reviewHash,
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
              link: `/editor/under-review`,
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

    // Mark deadline as completed on TimelineEnforcer smart contract
    if (assignment.timelineEnforcerIndex != null) {
      await markDeadlineCompleted(
        assignment.submissionId,
        assignment.timelineEnforcerIndex,
      );
    }

    // Check if all non-declined assignments are now submitted → transition to reviews_completed
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
        link: `/researcher/view-submissions`,
      });
    }
  });

  return NextResponse.json({
    reviewId: review.id,
  });
}
