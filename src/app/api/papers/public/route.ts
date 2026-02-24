import { NextResponse } from "next/server";
import { listPublicPapers } from "@/src/features/papers/queries";

export const runtime = "nodejs";

export async function GET() {
  const papers = await listPublicPapers();
  return NextResponse.json(papers);
}
