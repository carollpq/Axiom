import { db } from "@/src/shared/lib/db";
import {
  reviews,
  reviewAssignments,
  reviewCriteria,
  submissions,
  reputationEvents,
} from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";

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
  const review = (
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
      .set({ status: "submitted", submittedAt: new Date().toISOString() })
      .where(eq(reviewAssignments.id, input.assignmentId));
  }

  return review;
}

export async function updateReviewHedera(
  reviewId: string,
  hederaTxId: string,
) {
  return (
    await db
      .update(reviews)
      .set({ hederaTxId })
      .where(eq(reviews.id, reviewId))
      .returning()
  )[0] ?? null;
}

export interface PublishCriteriaInput {
  submissionId: string;
  criteriaJson: string;
  criteriaHash: string;
  hederaTxId?: string;
}

export async function publishCriteria(input: PublishCriteriaInput) {
  const criteria = (
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
      .set({ status: "criteria_published", criteriaHash: input.criteriaHash, criteriaTxId: input.hederaTxId ?? null })
      .where(eq(submissions.id, input.submissionId));
  }

  return criteria;
}

export interface CreateAssignmentInput {
  submissionId: string;
  reviewerWallet: string;
  deadline: string;
}

export async function createReviewAssignment(input: CreateAssignmentInput) {
  return (
    await db
      .insert(reviewAssignments)
      .values({
        submissionId: input.submissionId,
        reviewerWallet: input.reviewerWallet.toLowerCase(),
        deadline: input.deadline,
        status: "assigned",
      })
      .returning()
  )[0] ?? null;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: string,
  extra?: Record<string, string | null>,
) {
  return (
    await db
      .update(submissions)
      .set({ status: status as never, ...extra })
      .where(eq(submissions.id, submissionId))
      .returning()
  )[0] ?? null;
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
  )[0] ?? null;
}
