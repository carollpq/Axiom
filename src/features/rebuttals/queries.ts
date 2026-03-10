import { cache } from 'react';
import { db } from '@/src/shared/lib/db';
import { rebuttals } from '@/src/shared/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const getRebuttalBySubmission = cache(async (submissionId: string) => {
  return db.query.rebuttals.findFirst({
    where: eq(rebuttals.submissionId, submissionId),
    with: {
      responses: {
        with: { review: true },
      },
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
});

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
      eq(rebuttals.status, 'open'),
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

/**
 * Rebuttal author guard for server actions.
 */
export async function requireRebuttalAuthor(
  rebuttalId: string,
  wallet: string,
) {
  const rebuttal = await getRebuttalById(rebuttalId);

  if (!rebuttal) throw new Error('Rebuttal not found');
  if (rebuttal.authorWallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error('Forbidden');
  }

  return rebuttal;
}

/**
 * Rebuttal editor guard for server actions.
 */
export async function requireRebuttalEditor(
  rebuttalId: string,
  wallet: string,
) {
  const rebuttal = await getRebuttalById(rebuttalId);

  if (!rebuttal) throw new Error('Rebuttal not found');
  if (!rebuttal.submission?.journal) throw new Error('Submission not found');
  if (
    rebuttal.submission.journal.editorWallet.toLowerCase() !==
    wallet.toLowerCase()
  ) {
    throw new Error('Forbidden');
  }

  return rebuttal;
}

export type DbRebuttal = Awaited<ReturnType<typeof getRebuttalBySubmission>>;
export type DbRebuttalFull = Awaited<ReturnType<typeof getRebuttalById>>;
