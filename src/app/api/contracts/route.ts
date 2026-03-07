import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listUserContracts } from "@/src/features/contracts/queries";
import { createContract } from "@/src/features/contracts/actions";
import { requireSession, validationError } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

const createContractSchema = z.object({
  paperTitle: z.string().trim().min(1).max(500),
  paperId: z.string().uuid().nullish(),
});

export async function GET() {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const result = await listUserContracts(wallet);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const body = await req.json();
  const parsed = createContractSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const contract = await createContract({ ...parsed.data, wallet });
  if (!contract) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(contract, { status: 201 });
}
