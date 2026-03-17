import { cache } from 'react';
import { db } from '@/src/shared/lib/db';
import {
  papers,
  authorshipContracts,
  contractContributors,
  submissions,
  journals,
  reviewAssignments,
} from '@/src/shared/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getUserByWallet } from '@/src/features/users/queries';

/** Drizzle return type for papers with versions + contracts (no owner). */
export type DbPaperWithRelations = Awaited<
  ReturnType<typeof listUserPapers>
>[number];

/** Drizzle return type for papers with versions + contracts + owner. */
export type DbPaperWithOwner = NonNullable<
  Awaited<ReturnType<typeof getPaperById>>
>;

/** Returns papers owned by wallet OR where wallet is a contract contributor. */
export const listUserPapers = cache(async (walletAddress: string) => {
  const wallet = walletAddress.toLowerCase();

  // Run both lookups in parallel — they're independent
  const [user, contributorRows] = await Promise.all([
    getUserByWallet(wallet),
    db
      .select({ paperId: authorshipContracts.paperId })
      .from(contractContributors)
      .innerJoin(
        authorshipContracts,
        eq(contractContributors.contractId, authorshipContracts.id),
      )
      .where(eq(contractContributors.contributorWallet, wallet)),
  ]);

  // Papers owned by user
  const ownedIds = user
    ? (
        await db
          .select({ id: papers.id })
          .from(papers)
          .where(eq(papers.ownerId, user.id))
      ).map((r) => r.id)
    : [];

  // Papers where wallet is a contributor on any authorship contract
  const contributorIds = contributorRows
    .map((r) => r.paperId)
    .filter((id): id is string => id !== null);

  const allIds = [...new Set([...ownedIds, ...contributorIds])];
  if (allIds.length === 0) return [];

  return db.query.papers.findMany({
    where: inArray(papers.id, allIds),
    with: {
      versions: true,
      contracts: {
        with: { contributors: true },
      },
      submissions: {
        with: {
          journal: { columns: { id: true, name: true } },
          reviewAssignments: { columns: { id: true, status: true } },
        },
      },
    },
    orderBy: (papers, { desc }) => [desc(papers.updatedAt)],
  });
});

// TODO: Consider extracting a generic requireOwner<T> helper shared with requireContractOwner
/** Throws if wallet is not the paper owner. Uses the already-joined owner relation. */
export async function requirePaperOwner(paperId: string, wallet: string) {
  const paper = await getPaperById(paperId);
  if (!paper) throw new Error('Paper not found');
  if (paper.owner?.walletAddress?.toLowerCase() !== wallet.toLowerCase())
    throw new Error('Forbidden');
  return paper;
}

/** Checks if wallet is an editor or assigned reviewer for any submission of this paper. */
export async function canAccessPaperContent(
  paperId: string,
  wallet: string,
): Promise<boolean> {
  const walletLower = wallet.toLowerCase();
  const [editorRow, reviewerRow] = await Promise.all([
    db
      .select({ id: submissions.id })
      .from(submissions)
      .innerJoin(journals, eq(submissions.journalId, journals.id))
      .where(
        and(
          eq(submissions.paperId, paperId),
          eq(journals.editorWallet, walletLower),
        ),
      )
      .limit(1),
    db
      .select({ id: reviewAssignments.id })
      .from(reviewAssignments)
      .innerJoin(
        submissions,
        eq(reviewAssignments.submissionId, submissions.id),
      )
      .where(
        and(
          eq(submissions.paperId, paperId),
          eq(reviewAssignments.reviewerWallet, walletLower),
        ),
      )
      .limit(1),
  ]);
  return editorRow.length > 0 || reviewerRow.length > 0;
}

export async function getPaperById(id: string) {
  return (
    (await db.query.papers.findFirst({
      where: eq(papers.id, id),
      with: {
        versions: true,
        contracts: {
          with: { contributors: true },
        },
        owner: true,
      },
    })) ?? null
  );
}
