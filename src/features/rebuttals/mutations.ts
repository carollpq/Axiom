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

/** Creates a new rebuttal row with `open` status and a deadline. */
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
  reviewId: string;
  criterionId?: string;
  position: RebuttalPositionDb;
  justification: string;
  evidence?: string;
}

/** Inserts per-review responses and transitions rebuttal to `submitted`. */
export async function submitRebuttalResponses(
  rebuttalId: string,
  responses: RebuttalResponseInput[],
  rebuttalHash: string,
) {
  const rows = responses.map((r) => ({
    rebuttalId,
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
        .set({ status: 'submitted', rebuttalHash })
        .where(eq(rebuttals.id, rebuttalId))
        .returning()
    )[0] ?? null
  );
}

/** Backfills HCS transaction ID after async anchoring. */
export async function updateRebuttalHedera(
  rebuttalId: string,
  hederaTxId: string,
) {
  await db
    .update(rebuttals)
    .set({ hederaTxId })
    .where(eq(rebuttals.id, rebuttalId));
}

export interface ResolveRebuttalInput {
  rebuttalId: string;
  resolution: RebuttalResolutionDb;
  editorNotes: string;
}

/** Sets resolution + editor notes and transitions rebuttal to `resolved`. */
export async function resolveRebuttal(input: ResolveRebuttalInput) {
  return (
    (
      await db
        .update(rebuttals)
        .set({
          status: 'resolved',
          resolution: input.resolution,
          editorNotes: input.editorNotes,
          resolvedAt: new Date().toISOString(),
        })
        .where(eq(rebuttals.id, input.rebuttalId))
        .returning()
    )[0] ?? null
  );
}
