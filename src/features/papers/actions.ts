import { db } from "@/src/shared/lib/db";
import { papers, paperVersions, submissions, users } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import type { PaperStatusDb, StudyTypeDb } from "@/src/shared/lib/db/schema";

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

export async function createPaper(input: CreatePaperInput) {
  const user = (
    await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, input.wallet.toLowerCase()))
      .limit(1)
  )[0];

  if (!user) return null;

  return (
    await db
      .insert(papers)
      .values({
        title: input.title,
        abstract: input.abstract ?? null,
        studyType: input.studyType ?? "original",
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

export async function updatePaper(id: string, input: UpdatePaperInput) {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) return null;

  updates.updatedAt = new Date().toISOString();

  return (
    (
      await db.update(papers).set(updates).where(eq(papers.id, id)).returning()
    )[0] ?? null
  );
}

export interface CreateSubmissionInput {
  paperId: string;
  journalId: string;
  versionId: string;
}

export async function createSubmission(input: CreateSubmissionInput) {
  return (
    await db
      .insert(submissions)
      .values({
        paperId: input.paperId,
        journalId: input.journalId,
        versionId: input.versionId,
      })
      .returning()
  )[0] ?? null;
}

export async function updateSubmissionHedera(
  submissionId: string,
  hederaTxId: string,
  hederaTimestamp: string,
) {
  return (
    await db
      .update(submissions)
      .set({ hederaTxId, hederaTimestamp })
      .where(eq(submissions.id, submissionId))
      .returning()
  )[0] ?? null;
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

export async function createPaperVersion(input: CreatePaperVersionInput) {
  const paper = (
    await db
      .select()
      .from(papers)
      .where(eq(papers.id, input.paperId))
      .limit(1)
  )[0];

  if (!paper) return null;

  const version = (
    await db
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

  // Bump the paper's current version
  await db
    .update(papers)
    .set({ currentVersion: paper.currentVersion + 1, updatedAt: new Date().toISOString() })
    .where(eq(papers.id, input.paperId));

  return version;
}
