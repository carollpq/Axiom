import { cache } from 'react';
import { db } from '@/src/shared/lib/db';
import { getSession } from '@/src/shared/lib/auth/auth';
import {
  journals,
  submissions,
  reputationScores,
  journalIssues,
  journalReviewers,
  users,
  type SubmissionStatusDb,
} from '@/src/shared/lib/db/schema';
import { eq, sql, inArray, and } from 'drizzle-orm';

/** Throws if wallet is not the editor of this journal. */
export async function requireJournalEditor(journalId: string, wallet: string) {
  const journal = await db.query.journals.findFirst({
    where: eq(journals.id, journalId),
  });

  if (!journal) throw new Error('Journal not found');
  if (journal.editorWallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error('Forbidden');
  }

  return journal;
}

export const listJournals = cache(async () => {
  return db
    .select({
      id: journals.id,
      name: journals.name,
      reputationScore: journals.reputationScore,
    })
    .from(journals);
});

export const getJournalByEditorWallet = cache(async (editorWallet: string) => {
  return db.query.journals.findFirst({
    where: eq(sql`LOWER(${journals.editorWallet})`, editorWallet.toLowerCase()),
  });
});

export const listJournalSubmissions = cache(async (journalId?: string) => {
  return db.query.submissions.findMany({
    where: journalId ? eq(submissions.journalId, journalId) : undefined,
    with: {
      paper: {
        with: {
          owner: true,
          versions: true,
        },
      },
      journal: true,
      reviewCriteria: true,
      reviewAssignments: true,
      reviews: true,
    },
    orderBy: (s, { desc }) => [desc(s.submittedAt)],
  });
});

/** All users with the "reviewer" role — uses JSONB @> for SQL-level filtering. */
export const listReviewerPool = cache(async () => {
  return db.query.users.findMany({
    where: sql`${users.roles}::jsonb @> '["reviewer"]'::jsonb`,
  });
});

export const listReputationScores = cache(async () => {
  return db.select().from(reputationScores);
});

export const listJournalIssues = cache(async (journalId: string) => {
  return db.query.journalIssues.findMany({
    where: eq(journalIssues.journalId, journalId),
    with: {
      papers: {
        with: {
          submission: {
            with: { paper: true },
          },
        },
      },
    },
  });
});

export const listJournalReviewerWallets = cache(async (journalId: string) => {
  return db.query.journalReviewers.findMany({
    where: eq(journalReviewers.journalId, journalId),
  });
});

/** Joins journal_reviewers → users → reputation_scores in one query. */
export const listJournalReviewersWithStatus = cache(
  async (journalId: string) => {
    const rows = await db
      .select({
        id: journalReviewers.id,
        journalId: journalReviewers.journalId,
        wallet: journalReviewers.reviewerWallet,
        status: journalReviewers.status,
        addedAt: journalReviewers.addedAt,
        respondedAt: journalReviewers.respondedAt,
        user: users,
        score: reputationScores,
      })
      .from(journalReviewers)
      .leftJoin(
        users,
        eq(
          sql`LOWER(${users.walletAddress})`,
          sql`LOWER(${journalReviewers.reviewerWallet})`,
        ),
      )
      .leftJoin(
        reputationScores,
        eq(
          sql`LOWER(${reputationScores.userWallet})`,
          sql`LOWER(${journalReviewers.reviewerWallet})`,
        ),
      )
      .where(eq(journalReviewers.journalId, journalId));

    return rows;
  },
);

/** Lightweight count of submissions needing editor attention. */
export const getEditorNavCounts = cache(async (journalId: string) => {
  const rows = await db
    .select({
      status: submissions.status,
      count: sql<number>`count(*)::int`,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.journalId, journalId),
        inArray(submissions.status, [
          'submitted',
          'reviews_completed',
        ] satisfies SubmissionStatusDb[]),
      ),
    )
    .groupBy(submissions.status);

  const map = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  return {
    incoming: map['submitted'] ?? 0,
    decisionPending: map['reviews_completed'] ?? 0,
  };
});

export type DbJournalSubmission = Awaited<
  ReturnType<typeof listJournalSubmissions>
>[number];
export type DbReviewer = Awaited<ReturnType<typeof listReviewerPool>>[number];
export type DbReputationScore = Awaited<
  ReturnType<typeof listReputationScores>
>[number];
export type DbJournalIssue = Awaited<
  ReturnType<typeof listJournalIssues>
>[number];
export type DbJournalReviewerWithStatus = Awaited<
  ReturnType<typeof listJournalReviewersWithStatus>
>[number];

/** Resolves session wallet + journal in one call. Shared across editor content pages. */
export async function fetchEditorPageData() {
  const wallet = await getSession();
  if (!wallet) throw new Error('Unauthorized');
  const journal = await getJournalByEditorWallet(wallet);
  return { journal };
}
