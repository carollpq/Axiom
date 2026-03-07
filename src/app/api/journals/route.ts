import { NextResponse } from "next/server";
import { db } from "@/src/shared/lib/db";
import { journals } from "@/src/shared/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select({
      id: journals.id,
      name: journals.name,
      reputationScore: journals.reputationScore,
    })
    .from(journals);

  return NextResponse.json(rows);
}
