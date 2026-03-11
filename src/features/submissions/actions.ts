'use server';

import { after } from 'next/server';
import { db } from '@/src/shared/lib/db';
import { reviewAssignments, submissions } from '@/src/shared/lib/db/schema';
import type { SubmissionStatusDb } from '@/src/shared/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { canonicalJson, sha256 } from '@/src/shared/lib/hashing';
import { requireSession } from '@/src/shared/lib/auth/auth';
import { anchorToHcs } from '@/src/shared/lib/hedera/hcs';
import {
  requireSubmissionEditor,
  requireSubmissionAuthor,
} from '@/src/features/submissions/queries';
import { ROUTES } from '@/src/shared/lib/routes';
import {
  publishCriteria,
  updateCriteriaTxId,
  createReviewAssignment,
  updateSubmissionStatus,
  updateAssignmentTimelineIndex,
} from '@/src/features/reviews/mutations';
import { listReviewAssignmentsForSubmission } from '@/src/features/reviews/queries';
import {
  createNotification,
  notifyIfWallet,
} from '@/src/features/notifications/mutations';
import { openRebuttal } from '@/src/features/rebuttals/mutations';
import { registerDeadline } from '@/src/shared/lib/hedera/timeline-enforcer';
import type { ReviewCriterionInput } from '@/src/features/submissions/types';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

// ---------------------------------------------------------------------------
// Criteria
// ---------------------------------------------------------------------------

export async function publishCriteriaAction(
  submissionId: string,
  criteria: ReviewCriterionInput[],
) {
  const session = await requireSession();
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

  const result = await publishCriteria({
    submissionId,
    criteriaJson,
    criteriaHash,
  });

  if (!result) throw new Error('Failed to publish criteria');

  const authorWallet = submission.paper?.owner?.walletAddress;

  after(async () => {
    const [{ txId: hederaTxId }] = await Promise.all([
      anchorToHcs('HCS_TOPIC_CRITERIA', {
        type: 'criteria_published',
        submissionId,
        criteriaHash,
        timestamp: new Date().toISOString(),
      }),
      notifyIfWallet(authorWallet, {
        type: 'criteria_published',
        title: 'Review criteria published',
        body: `Review criteria have been published for "${submission.paper.title}".`,
        link: ROUTES.researcher.root,
      }),
    ]);

    if (hederaTxId) {
      await updateCriteriaTxId(submissionId, hederaTxId);
    }
  });

  return { criteriaHash };
}

// ---------------------------------------------------------------------------
// Assign Reviewers
// ---------------------------------------------------------------------------

export async function assignReviewersAction(
  submissionId: string,
  reviewerWallets: string[],
  deadlineDays?: number,
) {
  const session = await requireSession();
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

  const authorWallet = submission.paper?.owner?.walletAddress;

  after(async () => {
    await Promise.all([
      notifyIfWallet(authorWallet, {
        type: 'reviewers_assigned',
        title: 'Reviewers assigned',
        body: `${reviewerWallets.length} reviewer(s) have been assigned to "${submission.paper.title}".`,
        link: ROUTES.researcher.root,
      }),
      ...reviewerWallets.map((wallet) =>
        createNotification({
          userWallet: wallet,
          type: 'reviewers_assigned',
          title: 'New review assignment',
          body: `You have been assigned to review "${submission.paper?.title ?? 'a paper'}".`,
          link: ROUTES.reviewer.root,
        }),
      ),
      ...created.filter(Boolean).map(async (assignment) => {
        const result = await registerDeadline(
          submissionId,
          deadline,
          assignment!.reviewerWallet,
        );
        if (result) {
          await updateAssignmentTimelineIndex(assignment!.id, result.index);
        }
      }),
    ]);
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
  const session = await requireSession();
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
    const [{ txId: hederaTxId }] = await Promise.all([
      anchorToHcs('HCS_TOPIC_DECISIONS', {
        type: 'editorial_decision',
        submissionId,
        decision: input.decision,
        allCriteriaMet: input.allCriteriaMet,
        publicJustification:
          input.allCriteriaMet && input.decision === 'reject'
            ? input.comment
            : null,
        timestamp: new Date().toISOString(),
      }),
      notifyIfWallet(authorWallet, {
        type: 'decision_made',
        title: `Paper ${decisionLabel}`,
        body: `Your paper "${submission.paper.title}" has been ${decisionLabel}.`,
        link: ROUTES.researcher.root,
      }),
    ]);

    if (hederaTxId) {
      await db
        .update(submissions)
        .set({ decisionTxId: hederaTxId })
        .where(eq(submissions.id, submissionId));
    }
  });

  return { status: newStatus };
}

// ---------------------------------------------------------------------------
// View (mark as viewed by editor)
// ---------------------------------------------------------------------------

export async function markViewedAction(submissionId: string) {
  const session = await requireSession();
  const submission = await requireSubmissionEditor(submissionId, session);

  if (submission.status !== 'submitted') {
    return { status: submission.status, alreadyViewed: true };
  }

  await updateSubmissionStatus(submissionId, 'viewed_by_editor');

  const authorWallet = submission.paper.owner?.walletAddress;

  after(async () => {
    await Promise.all([
      anchorToHcs('HCS_TOPIC_SUBMISSIONS', {
        type: 'viewed_by_editor',
        submissionId,
        editorWallet: session,
        timestamp: new Date().toISOString(),
      }),
      notifyIfWallet(authorWallet, {
        type: 'submission_viewed',
        title: 'Paper viewed by editor',
        body: `Your paper "${submission.paper.title}" has been viewed by the editor.`,
        link: ROUTES.researcher.root,
      }),
    ]);
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
  const session = await requireSession();

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

    after(async () => {
      await Promise.all([
        anchorToHcs('HCS_TOPIC_SUBMISSIONS', {
          type: 'assignment_declined',
          submissionId,
          reviewerWallet: session,
          timestamp: new Date().toISOString(),
        }),
        notifyIfWallet(editorWallet, {
          type: 'assignment_declined',
          title: 'Reviewer declined assignment',
          body: `A reviewer has declined the assignment for "${submission.paper.title}".`,
          link: ROUTES.editor.root,
        }),
      ]);
    });

    return { status: 'declined' };
  }

  // Accept
  await db
    .update(reviewAssignments)
    .set({ status: 'accepted', acceptedAt: new Date().toISOString() })
    .where(eq(reviewAssignments.id, assignment.id));

  const allAssignments = await listReviewAssignmentsForSubmission(submissionId);
  const acceptedCount = allAssignments.filter(
    (a) => a.status === 'accepted',
  ).length;

  const editorWallet = submission.journal.editorWallet;

  const shouldTransitionToUnderReview =
    acceptedCount >= 2 &&
    (submission.status === 'reviewers_assigned' ||
      submission.status === 'criteria_published');

  if (shouldTransitionToUnderReview) {
    await updateSubmissionStatus(submissionId, 'under_review');
  }

  after(async () => {
    const notifications: Promise<void>[] = [
      notifyIfWallet(editorWallet, {
        type: 'assignment_accepted',
        title: 'Reviewer accepted assignment',
        body: `A reviewer has accepted the assignment for "${submission.paper.title}".`,
        link: ROUTES.editor.root,
      }),
    ];

    if (shouldTransitionToUnderReview) {
      const authorWallet = submission.paper.owner?.walletAddress;
      notifications.push(
        notifyIfWallet(authorWallet, {
          type: 'reviewers_assigned',
          title: 'Paper now under review',
          body: `Minimum reviewers accepted — your paper "${submission.paper.title}" is now under review.`,
          link: ROUTES.researcher.root,
        }),
      );
    }

    await Promise.all([
      anchorToHcs('HCS_TOPIC_SUBMISSIONS', {
        type: 'assignment_accepted',
        submissionId,
        reviewerWallet: session,
        acceptedCount,
        timestamp: new Date().toISOString(),
      }),
      ...notifications,
    ]);
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
  const session = await requireSession();
  const submission = await requireSubmissionAuthor(submissionId, session);

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
      const [{ txId }] = await Promise.all([
        anchorToHcs('HCS_TOPIC_SUBMISSIONS', {
          type: 'author_response',
          submissionId,
          action: 'accept',
          authorWallet: session,
          timestamp: now,
        }),
        notifyIfWallet(editorWallet, {
          type: 'author_response',
          title: 'Author accepted reviews',
          body: `The author has accepted reviews for "${submission.paper.title}".`,
          link: ROUTES.editor.root,
        }),
      ]);

      if (txId) {
        await db
          .update(submissions)
          .set({ authorResponseTxId: txId })
          .where(eq(submissions.id, submissionId));
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
    const [{ txId: hederaTxId }] = await Promise.all([
      anchorToHcs('HCS_TOPIC_DECISIONS', {
        type: 'rebuttal_requested',
        submissionId,
        authorWallet: session,
        deadline,
        timestamp: now,
      }),
      anchorToHcs('HCS_TOPIC_SUBMISSIONS', {
        type: 'author_response',
        submissionId,
        action: 'request_rebuttal',
        authorWallet: session,
        timestamp: now,
      }),
      notifyIfWallet(editorWallet, {
        type: 'author_response',
        title: 'Author requested rebuttal',
        body: `The author has requested a rebuttal for "${submission.paper.title}".`,
        link: ROUTES.editor.root,
      }),
    ]);

    if (hederaTxId) {
      await db
        .update(submissions)
        .set({ authorResponseTxId: hederaTxId })
        .where(eq(submissions.id, submissionId));
    }
  });

  return {
    status: 'rebuttal_requested',
    rebuttalId: rebuttal?.id,
    deadline,
  };
}
