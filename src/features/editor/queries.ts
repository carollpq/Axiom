import { cache } from "react";
import { db } from "@/src/shared/lib/db";
import { journals, submissions, reputationScores } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";

export const listJournals = cache(async () => {
  return db
    .select({ id: journals.id, name: journals.name, reputationScore: journals.reputationScore })
    .from(journals);
});

export const getJournalByEditorWallet = cache(async (editorWallet: string) => {
  return db.query.journals.findFirst({
    where: eq(journals.editorWallet, editorWallet.toLowerCase()),
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

export const listReviewerPool = cache(async () => {
  const reviewers = await db.query.users.findMany();
  return reviewers.filter((u) => (u.roles as string[]).includes("reviewer"));
});

export const listReputationScores = cache(async () => {
  return db.select().from(reputationScores);
});

export type DbJournalSubmission = Awaited<ReturnType<typeof listJournalSubmissions>>[number];
export type DbReviewer = Awaited<ReturnType<typeof listReviewerPool>>[number];
export type DbReputationScore = Awaited<ReturnType<typeof listReputationScores>>[number];
