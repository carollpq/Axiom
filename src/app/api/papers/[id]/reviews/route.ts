import { NextRequest, NextResponse } from "next/server";
import { listPublicReviewsForPaper } from "@/src/features/reviews/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: paperId } = await params;
  const reviews = await listPublicReviewsForPaper(paperId);
  return NextResponse.json(reviews);
}
