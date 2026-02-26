import { db } from "@/src/shared/lib/db";
import { reviewAssignments, reviewCriteria, reviews, submissions } from "@/src/shared/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getReviewAssignment(assignmentId: string, reviewerWallet: string) {
  return db.query.reviewAssignments.findFirst({
    where: and(
      eq(reviewAssignments.id, assignmentId),
      eq(reviewAssignments.reviewerWallet, reviewerWallet.toLowerCase()),
    ),
    with: {
      submission: {
        with: {
          paper: { with: { versions: true } },
          journal: true,
          reviewCriteria: true,
        },
      },
    },
  });
}

export async function getSubmissionWithCriteria(submissionId: string) {
  return db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      paper: { with: { versions: true } },
      journal: true,
      reviewCriteria: true,
    },
  });
}

export async function listAssignmentsByReviewer(reviewerWallet: string) {
  return db.query.reviewAssignments.findMany({
    where: eq(reviewAssignments.reviewerWallet, reviewerWallet.toLowerCase()),
    with: {
      submission: {
        with: {
          paper: true,
          journal: true,
        },
      },
    },
    orderBy: (a, { desc }) => [desc(a.assignedAt)],
  });
}

export async function listReviewAssignmentsForSubmission(submissionId: string) {
  return db.query.reviewAssignments.findMany({
    where: eq(reviewAssignments.submissionId, submissionId),
    orderBy: (a, { asc }) => [asc(a.assignedAt)],
  });
}

export async function getReviewByAssignmentId(assignmentId: string) {
  return db.query.reviews.findFirst({
    where: eq(reviews.assignmentId, assignmentId),
  });
}

export async function listReviewsForSubmission(submissionId: string) {
  return db.query.reviews.findMany({
    where: eq(reviews.submissionId, submissionId),
  });
}

export async function getPublishedCriteria(submissionId: string) {
  return db.query.reviewCriteria.findFirst({
    where: eq(reviewCriteria.submissionId, submissionId),
    orderBy: (c, { desc }) => [desc(c.publishedAt)],
  });
}

export type DbReviewAssignment = Awaited<ReturnType<typeof getReviewAssignment>>;
export type DbSubmissionWithCriteria = Awaited<ReturnType<typeof getSubmissionWithCriteria>>;
