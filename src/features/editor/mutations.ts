import { db } from '@/src/shared/lib/db';
import {
  journals,
  journalIssues,
  issuePapers,
  journalReviewers,
} from '@/src/shared/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';

/** No-ops if no fields provided. Auto-bumps updatedAt. */
export async function updateJournalMetadata(
  journalId: string,
  data: { aimsAndScope?: string; submissionCriteria?: string },
) {
  const { aimsAndScope, submissionCriteria } = data;
  if (aimsAndScope === undefined && submissionCriteria === undefined) return;

  return db
    .update(journals)
    .set({
      ...(aimsAndScope !== undefined && { aimsAndScope }),
      ...(submissionCriteria !== undefined && { submissionCriteria }),
      updatedAt: sql`now()`,
    })
    .where(eq(journals.id, journalId));
}

export async function createJournalIssue(journalId: string, label: string) {
  const [row] = await db
    .insert(journalIssues)
    .values({ journalId, label })
    .returning();
  return row;
}

/** Cascades: deletes associated issue_papers rows first. */
export async function deleteJournalIssue(issueId: string) {
  await db.delete(issuePapers).where(eq(issuePapers.issueId, issueId));
  await db.delete(journalIssues).where(eq(journalIssues.id, issueId));
}

export async function addPaperToIssue(issueId: string, submissionId: string) {
  const [row] = await db
    .insert(issuePapers)
    .values({ issueId, submissionId })
    .returning();
  return row;
}

export async function removePaperFromIssue(
  issueId: string,
  submissionId: string,
) {
  await db
    .delete(issuePapers)
    .where(
      and(
        eq(issuePapers.issueId, issueId),
        eq(issuePapers.submissionId, submissionId),
      ),
    );
}

export async function addReviewerToPool(
  journalId: string,
  reviewerWallet: string,
) {
  const [row] = await db
    .insert(journalReviewers)
    .values({ journalId, reviewerWallet: reviewerWallet.toLowerCase() })
    .returning();
  return row;
}

export async function removeReviewerFromPool(
  journalId: string,
  reviewerWallet: string,
) {
  await db
    .delete(journalReviewers)
    .where(
      and(
        eq(journalReviewers.journalId, journalId),
        eq(journalReviewers.reviewerWallet, reviewerWallet.toLowerCase()),
      ),
    );
}
