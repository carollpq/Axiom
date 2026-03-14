// Server actions for the submission pipeline.
// Pattern: auth → DB write → defer HCS anchoring + notifications via after().
'use server';

import { after } from 'next/server';
import { db } from '@/src/shared/lib/db';
import {
  reviewAssignments,
  type SubmissionStatusDb,
} from '@/src/shared/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { canonicalJson, sha256 } from '@/src/shared/lib/hashing';
import { requireSession } from '@/src/shared/lib/auth/auth';
import { anchorToHcs } from '@/src/shared/lib/hedera/hcs';
import { addReviewersToAccessConditions } from '@/src/shared/lib/lit/access-control';
import { updatePaper } from '@/src/features/papers/mutations';
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
  updateSubmissionTxId,
  updateAssignmentTimelineIndex,
} from '@/src/features/submissions/mutations';
import {
  listReviewAssignmentsForSubmission,
  listReviewsForSubmission,
  getPublishedCriteria,
} from '@/src/features/reviews/queries';
import {
  createNotification,
  notifyIfWallet,
} from '@/src/features/notifications/mutations';
import { openRebuttal } from '@/src/features/rebuttals/mutations';
import { registerDeadline } from '@/src/shared/lib/hedera/timeline-enforcer';
import { z } from 'zod';
import type { ReviewCriterionInput } from '@/src/features/submissions/types';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

// ---------------------------------------------------------------------------
// Criteria
// ---------------------------------------------------------------------------

/** Hash criteria, store in DB, anchor on HCS. Transitions to `criteria_published`. */
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

/** Create assignments (default 21-day deadline), register on TimelineEnforcer. */
export async function assignReviewersAction(
  submissionId: string,
  reviewerWallets: string[],
  deadlineDays?: number,
) {
  const session = await requireSession();
  const submission = await requireSubmissionEditor(submissionId, session);

  // State guard: only after criteria published
  const validAssignStates: SubmissionStatusDb[] = [
    'criteria_published',
    'reviewers_assigned',
  ];
  if (!validAssignStates.includes(submission.status as SubmissionStatusDb)) {
    throw new Error(
      'Reviewers can only be assigned after criteria are published',
    );
  }

  if (!reviewerWallets || reviewerWallets.length === 0) {
    throw new Error('reviewerWallets is required');
  }

  // Prevent duplicate assignments
  const existing = await listReviewAssignmentsForSubmission(submissionId);
  const existingWallets = new Set(
    existing.map((a) => a.reviewerWallet.toLowerCase()),
  );
  const newWallets = reviewerWallets.filter(
    (w) => !existingWallets.has(w.toLowerCase()),
  );
  if (newWallets.length === 0)
    throw new Error('All reviewers are already assigned');

  const resolvedDeadlineDays =
    deadlineDays ?? submission.reviewDeadlineDays ?? 21;
  const deadline = daysFromNow(resolvedDeadlineDays);

  const created = await Promise.all(
    newWallets.map((wallet) =>
      createReviewAssignment({
        submissionId,
        reviewerWallet: wallet,
        deadline,
      }),
    ),
  );

  await updateSubmissionStatus(submissionId, 'reviewers_assigned');
  const allAssignments = [...existing, ...created.filter(Boolean)];

  // Update Lit access conditions to add reviewer wallets
  if (submission.paper?.litAccessConditionsJson) {
    const updatedConditionsJson = addReviewersToAccessConditions(
      submission.paper.litAccessConditionsJson,
      newWallets,
    );
    await updatePaper(submission.paperId, {
      litAccessConditionsJson: updatedConditionsJson,
    });
  }

  const authorWallet = submission.paper?.owner?.walletAddress;

  after(async () => {
    await Promise.all([
      notifyIfWallet(authorWallet, {
        type: 'reviewers_assigned',
        title: 'Reviewers assigned',
        body: `${newWallets.length} reviewer(s) have been assigned to "${submission.paper.title}".`,
        link: ROUTES.researcher.root,
      }),
      ...newWallets.map((wallet) =>
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

const decisionSchema = z.object({
  decision: z.enum(['accept', 'reject', 'revise']),
  comment: z.string(),
});

/** Reject + allCriteriaMet requires a public justification (anchored on-chain). */
export async function makeDecisionAction(
  submissionId: string,
  input: {
    decision: Decision;
    comment: string;
  },
) {
  const session = await requireSession();
  const submission = await requireSubmissionEditor(submissionId, session);

  // State guard: only after reviews are complete
  const validDecisionStates: SubmissionStatusDb[] = [
    'reviews_completed',
    'rebuttal_open',
    'under_review',
  ];
  if (!validDecisionStates.includes(submission.status as SubmissionStatusDb)) {
    throw new Error('Decision can only be made after reviews are complete');
  }

  const validated = decisionSchema.parse(input);

  // Server-side allCriteriaMet computation
  const [reviewsList, publishedCriteria] = await Promise.all([
    listReviewsForSubmission(submissionId),
    getPublishedCriteria(submissionId),
  ]);

  // TODO: Extract allCriteriaMet computation to a shared helper (e.g. reviews/lib.ts)
  // so it can be reused by future consumers (cron jobs, rebuttal resolution, etc.)
  let allCriteriaMet = false;
  if (publishedCriteria?.criteriaJson) {
    const criteria = JSON.parse(publishedCriteria.criteriaJson) as Array<{
      id: string;
      required: boolean;
    }>;
    const requiredIds = criteria.filter((c) => c.required).map((c) => c.id);

    allCriteriaMet = reviewsList.every((review) => {
      if (!review.criteriaEvaluations) return false;
      const evals = JSON.parse(review.criteriaEvaluations) as Record<
        string,
        { value: string }
      >;
      return requiredIds.every((id) => evals[id]?.value === 'yes');
    });
  }

  if (
    validated.decision === 'reject' &&
    allCriteriaMet &&
    !validated.comment?.trim()
  ) {
    throw new Error(
      'A public justification comment is required when rejecting a paper that meets all criteria',
    );
  }

  const newStatus = STATUS_MAP[validated.decision];

  await updateSubmissionStatus(submissionId, newStatus, {
    decision: validated.decision,
    decisionJustification: validated.comment ?? null,
    decidedAt: new Date().toISOString(),
  });

  const authorWallet = submission.paper?.owner?.walletAddress;
  const decisionLabel =
    validated.decision === 'accept'
      ? 'accepted'
      : validated.decision === 'reject'
        ? 'rejected'
        : 'revision requested';

  after(async () => {
    const [{ txId: hederaTxId }] = await Promise.all([
      anchorToHcs('HCS_TOPIC_DECISIONS', {
        type: 'editorial_decision',
        submissionId,
        decision: validated.decision,
        allCriteriaMet,
        publicJustification:
          allCriteriaMet && validated.decision === 'reject'
            ? validated.comment
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
      await updateSubmissionTxId(submissionId, 'decisionTxId', hederaTxId);
    }
  });

  return { status: newStatus };
}

// ---------------------------------------------------------------------------
// View (mark as viewed by editor)
// ---------------------------------------------------------------------------

/** Idempotent — no-ops if already past `submitted`. */
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

/** Auto-transitions to `under_review` once 2+ reviewers have accepted. */
export async function acceptAssignmentAction(
  submissionId: string,
  action: 'accept' | 'decline',
) {
  if (action !== 'accept' && action !== 'decline') {
    throw new Error('Invalid action');
  }

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

/** Author accepts reviews or requests rebuttal (opens 14-day rebuttal window). */
export async function authorResponseAction(
  submissionId: string,
  action: 'accept' | 'request_rebuttal',
) {
  if (action !== 'accept' && action !== 'request_rebuttal') {
    throw new Error('Invalid action');
  }

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
        await updateSubmissionTxId(submissionId, 'authorResponseTxId', txId);
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
      await updateSubmissionTxId(
        submissionId,
        'authorResponseTxId',
        hederaTxId,
      );
    }
  });

  return {
    status: 'rebuttal_requested',
    rebuttalId: rebuttal?.id,
    deadline,
  };
}
