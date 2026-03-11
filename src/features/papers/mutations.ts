import { db } from '@/src/shared/lib/db';
import { papers, paperVersions } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserByWallet } from '@/src/features/users/queries';
import type { PaperStatusDb, StudyTypeDb } from '@/src/shared/lib/db/schema';

/** Backfills HCS transaction ID and timestamp after async anchoring. */
export async function updatePaperVersionHedera(
  versionId: string,
  hederaTxId: string,
  hederaTimestamp: string,
) {
  return (
    (
      await db
        .update(paperVersions)
        .set({ hederaTxId, hederaTimestamp })
        .where(eq(paperVersions.id, versionId))
        .returning()
    )[0] ?? null
  );
}

export interface CreatePaperInput {
  title: string;
  abstract: string;
  studyType?: StudyTypeDb;
  wallet: string;
  litDataToEncryptHash?: string | null;
  litAccessConditionsJson?: string | null;
}

/** Resolves wallet → user, then inserts the paper. Returns null if user not found. */
export async function createPaper(input: CreatePaperInput) {
  const user = await getUserByWallet(input.wallet);

  if (!user) return null;

  return (
    await db
      .insert(papers)
      .values({
        title: input.title,
        abstract: input.abstract ?? null,
        studyType: input.studyType ?? 'original',
        ownerId: user.id,
        litDataToEncryptHash: input.litDataToEncryptHash ?? null,
        litAccessConditionsJson: input.litAccessConditionsJson ?? null,
      })
      .returning()
  )[0];
}

export interface UpdatePaperInput {
  title?: string;
  abstract?: string;
  status?: PaperStatusDb;
}

/** No-ops (returns null) if no fields are provided. Auto-bumps updatedAt. */
export async function updatePaper(id: string, input: UpdatePaperInput) {
  if (
    input.title === undefined &&
    input.abstract === undefined &&
    input.status === undefined
  )
    return null;

  return (
    (
      await db
        .update(papers)
        .set({ ...input, updatedAt: new Date().toISOString() })
        .where(eq(papers.id, id))
        .returning()
    )[0] ?? null
  );
}

export interface CreatePaperVersionInput {
  paperId: string;
  paperHash: string;
  datasetHash?: string | null;
  codeRepoUrl?: string | null;
  codeCommitHash?: string | null;
  envSpecHash?: string | null;
  fileStorageKey?: string | null;
}

/** Inserts a version row and bumps paper.currentVersion in a single transaction. */
export async function createPaperVersion(input: CreatePaperVersionInput) {
  return db.transaction(async (tx) => {
    const paper = (
      await tx
        .select()
        .from(papers)
        .where(eq(papers.id, input.paperId))
        .limit(1)
    )[0];

    if (!paper) return null;

    const version = (
      await tx
        .insert(paperVersions)
        .values({
          paperId: input.paperId,
          versionNumber: paper.currentVersion,
          paperHash: input.paperHash,
          datasetHash: input.datasetHash ?? null,
          codeRepoUrl: input.codeRepoUrl ?? null,
          codeCommitHash: input.codeCommitHash ?? null,
          envSpecHash: input.envSpecHash ?? null,
          fileStorageKey: input.fileStorageKey ?? null,
        })
        .returning()
    )[0];

    await tx
      .update(papers)
      .set({
        currentVersion: paper.currentVersion + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(papers.id, input.paperId));

    return version;
  });
}
