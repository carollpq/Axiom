import { db } from "@/lib/db";
import { papers, paperVersions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { PaperStatusDb, StudyTypeDb, VisibilityDb } from "@/lib/db/schema";

export function updatePaperVersionHedera(
  versionId: string,
  hederaTxId: string,
  hederaTimestamp: string,
) {
  return (
    db
      .update(paperVersions)
      .set({ hederaTxId, hederaTimestamp })
      .where(eq(paperVersions.id, versionId))
      .returning()
      .get() ?? null
  );
}

export interface CreatePaperInput {
  title: string;
  abstract?: string | null;
  studyType?: StudyTypeDb;
  wallet: string;
}

export function createPaper(input: CreatePaperInput) {
  const user = db
    .select()
    .from(users)
    .where(eq(users.walletAddress, input.wallet.toLowerCase()))
    .limit(1)
    .get();

  if (!user) return null;

  return db
    .insert(papers)
    .values({
      title: input.title,
      abstract: input.abstract ?? null,
      studyType: input.studyType ?? "original",
      ownerId: user.id,
    })
    .returning()
    .get();
}

export interface UpdatePaperInput {
  title?: string;
  abstract?: string;
  status?: PaperStatusDb;
  visibility?: VisibilityDb;
  accessPrice?: string;
}

export function updatePaper(id: string, input: UpdatePaperInput) {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) return null;

  updates.updatedAt = new Date().toISOString();

  return (
    db.update(papers).set(updates).where(eq(papers.id, id)).returning().get() ??
    null
  );
}

export interface CreatePaperVersionInput {
  paperId: string;
  paperHash: string;
  datasetHash?: string | null;
  codeRepoUrl?: string | null;
  codeCommitHash?: string | null;
  envSpecHash?: string | null;
}

export function createPaperVersion(input: CreatePaperVersionInput) {
  const paper = db
    .select()
    .from(papers)
    .where(eq(papers.id, input.paperId))
    .limit(1)
    .get();

  if (!paper) return null;

  const version = db
    .insert(paperVersions)
    .values({
      paperId: input.paperId,
      versionNumber: paper.currentVersion,
      paperHash: input.paperHash,
      datasetHash: input.datasetHash ?? null,
      codeRepoUrl: input.codeRepoUrl ?? null,
      codeCommitHash: input.codeCommitHash ?? null,
      envSpecHash: input.envSpecHash ?? null,
    })
    .returning()
    .get();

  // Bump the paper's current version
  db.update(papers)
    .set({ currentVersion: paper.currentVersion + 1, updatedAt: new Date().toISOString() })
    .where(eq(papers.id, input.paperId))
    .run();

  return version;
}
