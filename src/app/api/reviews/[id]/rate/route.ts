import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/shared/lib/db";
import { reviews, reviewerRatings } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import { requireSession, recordReputation } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: reviewId } = await params;

  // Verify the review exists and the session user owns the paper
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
    with: {
      submission: {
        with: { paper: { with: { owner: true } } },
      },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.submission.paper.owner.walletAddress.toLowerCase() !== session.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { rating: number };

  if (!body.rating || body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
    return NextResponse.json({ error: "Rating must be an integer 1-5" }, { status: 400 });
  }

  // Check if already rated
  const existing = await db.query.reviewerRatings.findFirst({
    where: eq(reviewerRatings.reviewId, reviewId),
  });
  if (existing) {
    return NextResponse.json({ error: "Review already rated" }, { status: 409 });
  }

  const ratingHash = await hashString(canonicalJson({ rating: body.rating, reviewId }));

  const { serial } = await recordReputation(
    review.reviewerWallet,
    "author_rating",
    body.rating - 3, // 1→-2, 2→-1, 3→0, 4→+1, 5→+2
    `Author rating: ${body.rating}/5`,
    { type: "author_rating", rating: body.rating, reviewId },
  );

  const [ratingRow] = await db
    .insert(reviewerRatings)
    .values({
      reviewId,
      rating: body.rating,
      ratingHash,
      reputationTokenSerial: serial ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, ratingId: ratingRow?.id });
}
