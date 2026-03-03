import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { db } from "@/src/shared/lib/db";
import { reviews, reviewerRatings } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import { mintReputationToken } from "@/src/shared/lib/hedera/hts";
import { createReputationEvent } from "@/src/features/reviews/actions";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (review.submission.paper.owner.walletAddress.toLowerCase() !== sessionWallet.toLowerCase()) {
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

  const mintResult = await mintReputationToken(review.reviewerWallet, {
    type: "author_rating",
    rating: body.rating,
    reviewId,
  });

  const [ratingRow] = await db
    .insert(reviewerRatings)
    .values({
      reviewId,
      rating: body.rating,
      ratingHash,
      reputationTokenSerial: mintResult?.serial ?? null,
    })
    .returning();

  await createReputationEvent({
    userWallet: review.reviewerWallet,
    eventType: "author_rating",
    scoreDelta: body.rating - 3, // 1→-2, 2→-1, 3→0, 4→+1, 5→+2
    details: `Author rating: ${body.rating}/5`,
    htsTokenSerial: mintResult?.serial,
    hederaTxId: mintResult?.txId,
  });

  return NextResponse.json({ success: true, ratingId: ratingRow?.id });
}
