import { db } from "@/src/shared/lib/db";
import { rebuttals } from "@/src/shared/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getRebuttalBySubmission(submissionId: string) {
  return db.query.rebuttals.findFirst({
    where: eq(rebuttals.submissionId, submissionId),
    with: {
      responses: {
        with: { review: true },
      },
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

export async function getRebuttalById(rebuttalId: string) {
  return db.query.rebuttals.findFirst({
    where: eq(rebuttals.id, rebuttalId),
    with: {
      submission: {
        with: {
          paper: { with: { owner: true } },
          journal: true,
        },
      },
      responses: {
        with: { review: true },
      },
    },
  });
}

export async function listRebuttalSubmissionsForAuthor(walletAddress: string) {
  const openRebuttals = await db.query.rebuttals.findMany({
    where: and(
      eq(rebuttals.status, "open"),
      eq(rebuttals.authorWallet, walletAddress.toLowerCase()),
    ),
    with: {
      submission: {
        with: { paper: true },
      },
    },
  });

  return openRebuttals.map((r) => ({
    submissionId: r.submissionId,
    paperTitle: r.submission.paper.title,
    deadline: r.deadline,
    createdAt: r.createdAt,
  }));
}

export type DbRebuttal = Awaited<ReturnType<typeof getRebuttalBySubmission>>;
export type DbRebuttalFull = Awaited<ReturnType<typeof getRebuttalById>>;
