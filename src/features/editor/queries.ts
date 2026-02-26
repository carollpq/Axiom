import { db } from "@/src/shared/lib/db";
import { journals, submissions } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";

export async function listJournals() {
  return db
    .select({ id: journals.id, name: journals.name, reputationScore: journals.reputationScore })
    .from(journals);
}

export async function getJournalByEditorWallet(editorWallet: string) {
  return db.query.journals.findFirst({
    where: eq(journals.editorWallet, editorWallet.toLowerCase()),
  });
}

export async function listJournalSubmissions(journalId?: string) {
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
    },
    orderBy: (s, { desc }) => [desc(s.submittedAt)],
  });
}

export async function listReviewerPool() {
  const reviewers = await db.query.users.findMany();
  return reviewers.filter((u) => (u.roles as string[]).includes("reviewer"));
}

export type DbJournalSubmission = Awaited<ReturnType<typeof listJournalSubmissions>>[number];
export type DbReviewer = Awaited<ReturnType<typeof listReviewerPool>>[number];
