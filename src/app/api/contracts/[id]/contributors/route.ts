import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addContributor } from "@/src/features/contracts/actions";
import { createNotification } from "@/src/features/notifications/actions";
import { db } from "@/src/shared/lib/db";
import { authorshipContracts } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
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

  // Notify the added contributor (fire-and-forget, skip if adding themselves)
  if (parsed.data.contributorWallet.toLowerCase() !== wallet.toLowerCase()) {
    db.select({ paperTitle: authorshipContracts.paperTitle })
      .from(authorshipContracts)
      .where(eq(authorshipContracts.id, contractId))
      .limit(1)
      .then(([row]) => {
        const paperTitle = row?.paperTitle ?? "Untitled";
        return createNotification({
          userWallet: parsed.data.contributorWallet,
          type: "contributor_added",
          title: "Added to authorship contract",
          body: `You have been added as a contributor on "${paperTitle}". Please review and sign the contract.`,
          link: `/researcher/authorship-contracts`,
        });
      })
      .catch((err) => console.error("Contributor notification failed:", err));
  }

  return NextResponse.json(contributor, { status: 201 });
}

