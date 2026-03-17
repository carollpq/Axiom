// DB mutations for submissions. No auth — callers must authorize.

import { db } from '@/src/shared/lib/db';
import {
  reviewAssignments,
  reviewCriteria,
  submissions,
  type SubmissionStatusDb,
} from '@/src/shared/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export interface PublishCriteriaInput {
  submissionId: string;
  criteriaJson: string;
  criteriaHash: string;
}

/** Inserts criteria and transitions submission to `criteria_published`.
 *  Only allowed when submission is in `submitted` or `viewed_by_editor` status. */
export async function publishCriteria(input: PublishCriteriaInput) {
  const criteria =
    (
      await db
        .insert(reviewCriteria)
        .values({
          submissionId: input.submissionId,
          criteriaJson: input.criteriaJson,
          criteriaHash: input.criteriaHash,
        })
        .returning()
    )[0] ?? null;

  if (!criteria) return null;

  // Atomic status guard: only transitions from allowed statuses
  const updated =
    (
      await db
        .update(submissions)
        .set({
          status: 'criteria_published' as SubmissionStatusDb,
          criteriaHash: input.criteriaHash,
        })
        .where(
          and(
            eq(submissions.id, input.submissionId),
            inArray(submissions.status, [
              'submitted',
              'viewed_by_editor',
            ] as SubmissionStatusDb[]),
          ),
        )
        .returning()
    )[0] ?? null;

  if (!updated) return null;

  return criteria;
}

/** Backfills HCS tx ID on both submissions and reviewCriteria rows. */
export async function updateCriteriaTxId(
  submissionId: string,
  hederaTxId: string,
) {
  await Promise.all([
    db
      .update(submissions)
      .set({ criteriaTxId: hederaTxId })
      .where(eq(submissions.id, submissionId)),
    db
      .update(reviewCriteria)
      .set({ hederaTxId })
      .where(eq(reviewCriteria.submissionId, submissionId)),
  ]);
}

export interface CreateSubmissionInput {
  paperId: string;
  journalId: string;
  versionId: string;
}

export async function createSubmission(input: CreateSubmissionInput) {
  return (
    (
      await db
        .insert(submissions)
        .values({
          paperId: input.paperId,
          journalId: input.journalId,
          versionId: input.versionId,
        })
        .returning()
    )[0] ?? null
  );
}

/** Sets HCS tx ID and consensus timestamp on a submission. */
export async function updateSubmissionHedera(
  submissionId: string,
  hederaTxId: string,
  hederaTimestamp: string,
) {
  return (
    (
      await db
        .update(submissions)
        .set({ hederaTxId, hederaTimestamp })
        .where(eq(submissions.id, submissionId))
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

/** Updates status and optionally merges extra columns (e.g. `decidedAt`). */
export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatusDb,
  extra?: Partial<typeof submissions.$inferInsert>,
) {
  return (
    (
      await db
        .update(submissions)
        .set({ status, ...extra })
        .where(eq(submissions.id, submissionId))
        .returning()
    )[0] ?? null
  );
}

/** Backfills a Hedera tx ID on a dynamic submission column. */
export async function updateSubmissionTxId(
  submissionId: string,
  field: 'decisionTxId' | 'authorResponseTxId' | 'hederaTxId',
  txId: string,
) {
  await db
    .update(submissions)
    .set({ [field]: txId })
    .where(eq(submissions.id, submissionId));
}

/** Stores the on-chain TimelineEnforcer index for cron cross-verification. */
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
