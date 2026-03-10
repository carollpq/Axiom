'use server';

import { after } from 'next/server';
import { db } from '@/src/shared/lib/db';
import { reviewAssignments, submissions } from '@/src/shared/lib/db/schema';
import type { SubmissionStatusDb } from '@/src/shared/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { canonicalJson, sha256 } from '@/src/shared/lib/hashing';
import {
  requireAuth,
  requireSubmissionEditor,
  anchorAndNotify,
  anchorToHcs,
} from '@/src/shared/lib/server-action-helpers';
import { ROUTES } from '@/src/shared/lib/routes';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}
import {
  publishCriteria,
  createReviewAssignment,
  updateSubmissionStatus,
  updateAssignmentTimelineIndex,
} from '@/src/features/reviews/mutations';
import { listReviewAssignmentsForSubmission } from '@/src/features/reviews/queries';
import { createNotification } from '@/src/features/notifications/mutations';
import { openRebuttal } from '@/src/features/rebuttals/mutations';
import { registerDeadline } from '@/src/shared/lib/hedera/timeline-enforcer';

// ---------------------------------------------------------------------------
// Criteria
// ---------------------------------------------------------------------------

interface ReviewCriterionInput {
  id: string;
  label: string;
  evaluationType: 'yes_no_partially' | 'scale_1_5';
  description?: string;
  required: boolean;
}

export async function publishCriteriaAction(
  submissionId: string,
  criteria: ReviewCriterionInput[],
) {
  const session = await requireAuth();
  const submission = await requireSubmissionEditor(submissionId, session);

  if (
    submission.status !== 'submitted' &&
    submission.status !== 'viewed_by_editor'
  ) {
    throw new Error(
      "Criteria can only be published for submissions in 'submitted' or 'viewed_by_editor' status",
    );
  }

  if (!criteria || criteria.length === 0) {
    throw new Error('At least one criterion is required');
  }

  const criteriaJson = canonicalJson(criteria);
  const criteriaHash = await sha256(criteriaJson);

  const authorWallet = submission.paper?.owner?.walletAddress;

  const { txId: hederaTxId } = await anchorAndNotify({
    topic: 'HCS_TOPIC_CRITERIA',
    payload: {
      type: 'criteria_published',
      submissionId,
      criteriaHash,
      timestamp: new Date().toISOString(),
    },
    notifications: authorWallet
      ? [
          {
            userWallet: authorWallet,
            type: 'criteria_published',
            title: 'Review criteria published',
            body: `Review criteria have been published for "${submission.paper.title}".`,
            link: ROUTES.researcher.root,
          },
        ]
      : [],
  });

  const result = await publishCriteria({
    submissionId,
    criteriaJson,
    criteriaHash,
    hederaTxId,
  });

  if (!result) throw new Error('Failed to publish criteria');

  return { criteriaHash, hederaTxId };
}

// ---------------------------------------------------------------------------
// Assign Reviewers
// ---------------------------------------------------------------------------

export async function assignReviewersAction(
  submissionId: string,
  reviewerWallets: string[],
  deadlineDays?: number,
) {
  const session = await requireAuth();
  const submission = await requireSubmissionEditor(submissionId, session);

  if (!reviewerWallets || reviewerWallets.length === 0) {
    throw new Error('reviewerWallets is required');
  }

  const resolvedDeadlineDays =
    deadlineDays ?? submission.reviewDeadlineDays ?? 21;
  const deadline = daysFromNow(resolvedDeadlineDays);

  const created = await Promise.all(
    reviewerWallets.map((wallet) =>
      createReviewAssignment({
        submissionId,
        reviewerWallet: wallet,
        deadline,
      }),
    ),
  );

  await updateSubmissionStatus(submissionId, 'reviewers_assigned');

  const allAssignments = await listReviewAssignmentsForSubmission(submissionId);

  // Notify paper author
  if (submission.paper?.owner?.walletAddress) {
    await createNotification({
      userWallet: submission.paper.owner.walletAddress,
      type: 'reviewers_assigned',
      title: 'Reviewers assigned',
      body: `${reviewerWallets.length} reviewer(s) have been assigned to "${submission.paper.title}".`,
      link: ROUTES.researcher.root,
    });
  }

  // Notify each assigned reviewer
  await Promise.all(
    reviewerWallets.map((wallet) =>
      createNotification({
        userWallet: wallet,
        type: 'reviewers_assigned',
        title: 'New review assignment',
        body: `You have been assigned to review "${submission.paper?.title ?? 'a paper'}".`,
        link: ROUTES.reviewer.root,
      }),
    ),
  );

  // Non-blocking: register deadlines on TimelineEnforcer smart contract
  after(async () => {
    await Promise.all(
      created.filter(Boolean).map(async (assignment) => {
        const result = await registerDeadline(
          submissionId,
          deadline,
          assignment!.reviewerWallet,
        );
        if (result) {
          await updateAssignmentTimelineIndex(assignment!.id, result.index);
        }
      }),
    );
  });

  return {
    assignments: allAssignments,
    created: created.length,
  };
}

// ---------------------------------------------------------------------------
// Decision
// ---------------------------------------------------------------------------

type Decision = 'accept' | 'reject' | 'revise';

const STATUS_MAP: Record<Decision, SubmissionStatusDb> = {
  accept: 'accepted',
  reject: 'rejected',
  revise: 'revision_requested',
};

export async function makeDecisionAction(
  submissionId: string,
  input: {
    decision: Decision;
    comment: string;
    allCriteriaMet: boolean;
  },
) {
  const session = await requireAuth();
  const submission = await requireSubmissionEditor(submissionId, session);

  if (!input.decision) {
    throw new Error('Invalid decision');
  }

  if (
    input.decision === 'reject' &&
    input.allCriteriaMet &&
    !input.comment?.trim()
  ) {
    throw new Error(
      'A public justification comment is required when rejecting a paper that meets all criteria',
    );
  }

  const newStatus = STATUS_MAP[input.decision];

  await updateSubmissionStatus(submissionId, newStatus, {
    decision: input.decision,
    decisionJustification: input.comment ?? null,
    decidedAt: new Date().toISOString(),
  });

  const authorWallet = submission.paper?.owner?.walletAddress;
  const decisionLabel =
    input.decision === 'accept'
      ? 'accepted'
      : input.decision === 'reject'
        ? 'rejected'
        : 'revision requested';

  after(async () => {
    const { txId: hederaTxId } = await anchorAndNotify({
      topic: 'HCS_TOPIC_DECISIONS',
      payload: {
        type: 'editorial_decision',
        submissionId,
        decision: input.decision,
        allCriteriaMet: input.allCriteriaMet,
        publicJustification:
          input.allCriteriaMet && input.decision === 'reject'
            ? input.comment
            : null,
        timestamp: new Date().toISOString(),
      },
      notifications: authorWallet
        ? [
            {
              userWallet: authorWallet,
              type: 'decision_made',
              title: `Paper ${decisionLabel}`,
              body: `Your paper "${submission.paper.title}" has been ${decisionLabel}.`,
              link: ROUTES.researcher.root,
            },
          ]
        : [],
    });

    if (hederaTxId) {
      await updateSubmissionStatus(submissionId, newStatus, {
        decisionTxId: hederaTxId,
      });
    }
  });

  return { status: newStatus };
}

// ---------------------------------------------------------------------------
// View (mark as viewed by editor)
// ---------------------------------------------------------------------------

export async function markViewedAction(submissionId: string) {
  const session = await requireAuth();
  const submission = await requireSubmissionEditor(submissionId, session);

  if (submission.status !== 'submitted') {
    return { status: submission.status, alreadyViewed: true };
  }

  await updateSubmissionStatus(submissionId, 'viewed_by_editor');

  const authorWallet = submission.paper.owner?.walletAddress ?? '';

  after(async () => {
    await anchorAndNotify({
      topic: 'HCS_TOPIC_SUBMISSIONS',
      payload: {
        type: 'viewed_by_editor',
        submissionId,
        editorWallet: session,
        timestamp: new Date().toISOString(),
      },
      notifications: authorWallet
        ? [
            {
              userWallet: authorWallet,
              type: 'submission_viewed',
              title: 'Paper viewed by editor',
              body: `Your paper "${submission.paper.title}" has been viewed by the editor.`,
              link: ROUTES.researcher.root,
            },
          ]
        : [],
    });
  });

  return { status: 'viewed_by_editor' };
}

// ---------------------------------------------------------------------------
// Accept/Decline Assignment
// ---------------------------------------------------------------------------

export async function acceptAssignmentAction(
  submissionId: string,
  action: 'accept' | 'decline',
) {
  const session = await requireAuth();

  const assignment = await db.query.reviewAssignments.findFirst({
    where: and(
      eq(reviewAssignments.submissionId, submissionId),
      eq(reviewAssignments.reviewerWallet, session.toLowerCase()),
      eq(reviewAssignments.status, 'assigned'),
    ),
    with: {
      submission: {
        with: { paper: { with: { owner: true } }, journal: true },
      },
    },
  });

  if (!assignment) throw new Error('No pending assignment found');

  const submission = assignment.submission;

  if (action === 'decline') {
    await db
      .update(reviewAssignments)
      .set({ status: 'declined' })
      .where(eq(reviewAssignments.id, assignment.id));

    const editorWallet = submission.journal.editorWallet;
    if (editorWallet) {
      await anchorAndNotify({
        topic: 'HCS_TOPIC_SUBMISSIONS',
        payload: {
          type: 'assignment_declined',
          submissionId,
          reviewerWallet: session,
          timestamp: new Date().toISOString(),
        },
        notifications: [
          {
            userWallet: editorWallet,
            type: 'assignment_declined',
            title: 'Reviewer declined assignment',
            body: `A reviewer has declined the assignment for "${submission.paper.title}".`,
            link: ROUTES.editor.root,
          },
        ],
      });
    }

    return { status: 'declined' };
  }

  // Accept
  await db
    .update(reviewAssignments)
    .set({ status: 'accepted', acceptedAt: new Date().toISOString() })
    .where(eq(reviewAssignments.id, assignment.id));

  const allAssignments = await listReviewAssignmentsForSubmission(submissionId);
  const acceptedCount = allAssignments.filter(
    (a) => a.status === 'accepted' || a.id === assignment.id,
  ).length;

  const notifications: Parameters<typeof anchorAndNotify>[0]['notifications'] =
    [];
  const editorWallet = submission.journal.editorWallet;

  if (editorWallet) {
    notifications.push({
      userWallet: editorWallet,
      type: 'assignment_accepted',
      title: 'Reviewer accepted assignment',
      body: `A reviewer has accepted the assignment for "${submission.paper.title}".`,
      link: ROUTES.editor.root,
    });
  }

  if (
    acceptedCount >= 2 &&
    (submission.status === 'reviewers_assigned' ||
      submission.status === 'criteria_published')
  ) {
    await updateSubmissionStatus(submissionId, 'under_review');

    const authorWallet = submission.paper.owner?.walletAddress;
    if (authorWallet) {
      notifications.push({
        userWallet: authorWallet,
        type: 'reviewers_assigned',
        title: 'Paper now under review',
        body: `Minimum reviewers accepted — your paper "${submission.paper.title}" is now under review.`,
        link: ROUTES.researcher.root,
      });
    }
  }

  await anchorAndNotify({
    topic: 'HCS_TOPIC_SUBMISSIONS',
    payload: {
      type: 'assignment_accepted',
      submissionId,
      reviewerWallet: session,
      acceptedCount,
      timestamp: new Date().toISOString(),
    },
    notifications,
  });

  return { status: 'accepted', acceptedCount };
}

// ---------------------------------------------------------------------------
// Author Response
// ---------------------------------------------------------------------------

export async function authorResponseAction(
  submissionId: string,
  action: 'accept' | 'request_rebuttal',
) {
  const session = await requireAuth();

  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { paper: { with: { owner: true } }, journal: true },
  });

  if (!submission) throw new Error('Submission not found');

  if (
    submission.paper.owner?.walletAddress?.toLowerCase() !==
    session.toLowerCase()
  ) {
    throw new Error('Forbidden');
  }

  if (submission.status !== 'reviews_completed') {
    throw new Error('Submission must be in reviews_completed status');
  }

  const now = new Date().toISOString();
  const editorWallet = submission.journal.editorWallet;

  if (action === 'accept') {
    await updateSubmissionStatus(submissionId, 'reviews_completed', {
      authorResponseStatus: 'accepted',
      authorResponseAt: now,
    });

    after(async () => {
      const { txId } = await anchorAndNotify({
        topic: 'HCS_TOPIC_SUBMISSIONS',
        payload: {
          type: 'author_response',
          submissionId,
          action: 'accept',
          authorWallet: session,
          timestamp: now,
        },
        notifications: editorWallet
          ? [
              {
                userWallet: editorWallet,
                type: 'author_response',
                title: 'Author accepted reviews',
                body: `The author has accepted reviews for "${submission.paper.title}".`,
                link: ROUTES.editor.root,
              },
            ]
          : [],
      });

      if (txId) {
        await updateSubmissionStatus(submissionId, 'reviews_completed', {
          authorResponseTxId: txId,
        });
      }
    });

    return { status: 'accepted' };
  }

  // Request rebuttal
  const deadline = daysFromNow(14);

  await updateSubmissionStatus(submissionId, 'rebuttal_open', {
    authorResponseStatus: 'rebuttal_requested',
    authorResponseAt: now,
  });

  const rebuttal = await openRebuttal({
    submissionId,
    authorWallet: session,
    deadline,
  });

  after(async () => {
    const { txId: hederaTxId } = await anchorToHcs('HCS_TOPIC_DECISIONS', {
      type: 'rebuttal_requested',
      submissionId,
      authorWallet: session,
      deadline,
      timestamp: now,
    });

    if (hederaTxId) {
      await updateSubmissionStatus(submissionId, 'rebuttal_open', {
        authorResponseTxId: hederaTxId,
      });
    }

    if (editorWallet) {
      await anchorAndNotify({
        topic: 'HCS_TOPIC_SUBMISSIONS',
        payload: {
          type: 'author_response',
          submissionId,
          action: 'request_rebuttal',
          authorWallet: session,
          timestamp: now,
        },
        notifications: [
          {
            userWallet: editorWallet,
            type: 'author_response',
            title: 'Author requested rebuttal',
            body: `The author has requested a rebuttal for "${submission.paper.title}".`,
            link: ROUTES.editor.root,
          },
        ],
      });
    }
  });

  return {
    status: 'rebuttal_requested',
    rebuttalId: rebuttal?.id,
    deadline,
  };
}
