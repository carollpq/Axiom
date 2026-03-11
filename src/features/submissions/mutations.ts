import { db } from '@/src/shared/lib/db';
import {
  reviewAssignments,
  reviewCriteria,
  submissions,
  type SubmissionStatusDb,
} from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface PublishCriteriaInput {
  submissionId: string;
  criteriaJson: string;
  criteriaHash: string;
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
        })
        .returning()
    )[0] ?? null;

  if (criteria) {
    await db
      .update(submissions)
      .set({
        status: 'criteria_published',
        criteriaHash: input.criteriaHash,
      })
      .where(eq(submissions.id, input.submissionId));
  }

  return criteria;
}

/** Backfill HCS transaction ID after async anchoring. */
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

/** Backfill a Hedera transaction ID on a submission column. */
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
