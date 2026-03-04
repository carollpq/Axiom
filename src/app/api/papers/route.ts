import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listUserPapers } from "@/src/features/papers/queries";
import { createPaper } from "@/src/features/papers/actions";
import { requireSession } from "@/src/shared/lib/api-helpers";
import { STUDY_TYPE_VALUES, PAPER_LIMITS } from "@/src/features/researcher/config/paper-registration";

export const runtime = "nodejs";

const createPaperSchema = z.object({
  title: z.string().trim()
    .min(PAPER_LIMITS.title.min, `Title must be at least ${PAPER_LIMITS.title.min} characters`)
    .max(PAPER_LIMITS.title.max, `Title must be at most ${PAPER_LIMITS.title.max} characters`),
  abstract: z.string().trim()
    .min(PAPER_LIMITS.abstract.min, `Abstract must be at least ${PAPER_LIMITS.abstract.min} characters`)
    .max(PAPER_LIMITS.abstract.max, `Abstract must be at most ${PAPER_LIMITS.abstract.max} characters`),
  studyType: z.enum(STUDY_TYPE_VALUES).optional(),
  litDataToEncryptHash: z.string().nullish(),
  litAccessConditionsJson: z.string().nullish(),
});

export async function GET() {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const result = await listUserPapers(wallet);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const body = await req.json();
  const parsed = createPaperSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const paper = await createPaper({ ...parsed.data, wallet });
  if (!paper) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(paper, { status: 201 });
}
