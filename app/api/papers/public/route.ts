import { NextResponse } from "next/server";
import { listPublicPapers } from "@/features/papers";

export const runtime = "nodejs";

export async function GET() {
  const papers = listPublicPapers();
  return NextResponse.json(papers);
}
