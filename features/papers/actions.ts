import { db } from "@/lib/db";
import { papers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { PaperStatusDb, StudyTypeDb, VisibilityDb } from "@/lib/db/schema";

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
