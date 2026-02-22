import { db } from "@/lib/db";
import { papers, users } from "@/lib/db/schema";
import { eq, ne } from "drizzle-orm";

export function listUserPapers(walletAddress: string) {
  const user = db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress.toLowerCase()))
    .limit(1)
    .get();

  if (!user) return [];

  return db.query.papers.findMany({
    where: eq(papers.ownerId, user.id),
    with: {
      versions: true,
      contracts: {
        with: { contributors: true },
      },
    },
    orderBy: (papers, { desc }) => [desc(papers.updatedAt)],
  });
}

/** All publicly visible papers — used by the public explorer, no auth required. */
export function listPublicPapers() {
  return db.query.papers.findMany({
    where: eq(papers.visibility, "public"),
    with: {
      versions: true,
      contracts: {
        with: { contributors: true },
      },
      owner: true,
    },
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  });
}

export function getPaperById(id: string) {
  return (
    db.query.papers.findFirst({
      where: eq(papers.id, id),
      with: {
        versions: true,
        contracts: {
          with: { contributors: true },
        },
        owner: true,
      },
    }) ?? null
  );
}
