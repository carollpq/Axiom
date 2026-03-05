import { db } from "@/src/shared/lib/db";
import { papers, users, authorshipContracts, contractContributors } from "@/src/shared/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

/** Drizzle return type for papers with versions + contracts (no owner). */
export type DbPaperWithRelations = Awaited<ReturnType<typeof listUserPapers>>[number];

/** Drizzle return type for papers with versions + contracts + owner. */
export type DbPaperWithOwner = NonNullable<Awaited<ReturnType<typeof getPaperById>>>;

export async function listUserPapers(walletAddress: string) {
  const wallet = walletAddress.toLowerCase();

  // Run both lookups in parallel — they're independent
  const [user, contributorRows] = await Promise.all([
    db.select().from(users).where(eq(users.walletAddress, wallet)).limit(1).then(r => r[0]),
    db
      .select({ paperId: authorshipContracts.paperId })
      .from(contractContributors)
      .innerJoin(authorshipContracts, eq(contractContributors.contractId, authorshipContracts.id))
      .where(eq(contractContributors.contributorWallet, wallet)),
  ]);

  // Papers owned by user
  const ownedIds = user
    ? (await db.select({ id: papers.id }).from(papers).where(eq(papers.ownerId, user.id))).map(r => r.id)
    : [];

  // Papers where wallet is a contributor on any authorship contract
  const contributorIds = contributorRows.map(r => r.paperId).filter((id): id is string => id !== null);

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
