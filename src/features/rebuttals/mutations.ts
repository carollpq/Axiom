import { db } from '@/src/shared/lib/db';
import { rebuttals, rebuttalResponses } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';
import type {
  RebuttalResolutionDb,
  RebuttalPositionDb,
} from '@/src/shared/lib/db/schema';

export interface OpenRebuttalInput {
  submissionId: string;
  authorWallet: string;
  deadline: string;
  hederaTxId?: string;
}

export async function openRebuttal(input: OpenRebuttalInput) {
  return (
    (
      await db
        .insert(rebuttals)
        .values({
          submissionId: input.submissionId,
          authorWallet: input.authorWallet.toLowerCase(),
          deadline: input.deadline,
          hederaTxId: input.hederaTxId ?? null,
        })
        .returning()
    )[0] ?? null
  );
}

export interface RebuttalResponseInput {
  rebuttalId: string;
  reviewId: string;
  criterionId?: string;
  position: RebuttalPositionDb;
  justification: string;
  evidence?: string;
}

export async function submitRebuttalResponses(
  rebuttalId: string,
  responses: RebuttalResponseInput[],
  rebuttalHash: string,
  hederaTxId?: string,
) {
  const rows = responses.map((r) => ({
    rebuttalId: r.rebuttalId,
    reviewId: r.reviewId,
    criterionId: r.criterionId ?? null,
    position: r.position,
    justification: r.justification,
    evidence: r.evidence ?? null,
  }));

  await db.insert(rebuttalResponses).values(rows);

  return (
    (
      await db
        .update(rebuttals)
        .set({
          status: 'submitted',
          rebuttalHash,
          hederaTxId: hederaTxId ?? null,
        })
        .where(eq(rebuttals.id, rebuttalId))
        .returning()
    )[0] ?? null
  );
}

export interface ResolveRebuttalInput {
  rebuttalId: string;
  resolution: RebuttalResolutionDb;
  editorNotes: string;
  hederaTxId?: string;
}

export async function resolveRebuttal(input: ResolveRebuttalInput) {
  return (
    (
      await db
        .update(rebuttals)
        .set({
          status: 'resolved',
          resolution: input.resolution,
          editorNotes: input.editorNotes,
          hederaTxId: input.hederaTxId ?? null,
          resolvedAt: new Date().toISOString(),
        })
        .where(eq(rebuttals.id, input.rebuttalId))
        .returning()
    )[0] ?? null
  );
}
