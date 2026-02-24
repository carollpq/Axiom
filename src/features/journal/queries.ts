import { db } from "@/src/shared/lib/db";

export async function listJournalSubmissions() {
  return db.query.submissions.findMany({
    with: {
      paper: {
        with: {
          owner: true,
          versions: true,
        },
      },
      journal: true,
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
