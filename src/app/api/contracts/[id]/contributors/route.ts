import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addContributor } from "@/src/features/contracts/actions";
import { requireSession, validationError } from "@/src/shared/lib/api-helpers";
import { EVM_ADDRESS_REGEX } from "@/src/shared/lib/validation";

export const runtime = "nodejs";

const addContributorSchema = z.object({
  contributorWallet: z.string().regex(EVM_ADDRESS_REGEX, "Invalid wallet address"),
  contributionPct: z.number().int().min(0).max(100),
  contributorName: z.string().trim().max(200).nullish(),
  roleDescription: z.string().trim().max(500).nullish(),
  isCreator: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const { id: contractId } = await params;
  const body = await req.json();
  const parsed = addContributorSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const contributor = await addContributor({ ...parsed.data, contractId });
  return NextResponse.json(contributor, { status: 201 });
}

