import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/src/shared/lib/db";
import { reviewerRatings } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import {
  requireSession,
  requireReviewWithPaperOwner,
  anchorToHcs,
  recordReputation,
  validationError,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

const ratingSchema = z.object({
  actionableFeedback: z.number().int().min(1).max(5),
  deepEngagement: z.number().int().min(1).max(5),
  fairObjective: z.number().int().min(1).max(5),
  justifiedRecommendation: z.number().int().min(1).max(5),
  appropriateExpertise: z.number().int().min(1).max(5),
  comment: z.string().trim().max(10_000).nullish(),
});

const PROTOCOL_KEYS = [
  "actionableFeedback",
  "deepEngagement",
  "fairObjective",
  "justifiedRecommendation",
  "appropriateExpertise",
] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: reviewId } = await params;

  const review = await requireReviewWithPaperOwner(reviewId, session);
  if (review instanceof NextResponse) return review;

  const body = await req.json();
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const {
    actionableFeedback, deepEngagement, fairObjective,
    justifiedRecommendation, appropriateExpertise, comment,
  } = parsed.data;

  // Check if already rated
  const existing = await db.query.reviewerRatings.findFirst({
    where: eq(reviewerRatings.reviewId, reviewId),
  });
  if (existing) {
    return NextResponse.json({ error: "Review already rated" }, { status: 409 });
  }

  const overallRating = Math.round(
    PROTOCOL_KEYS.reduce((sum, k) => sum + parsed.data[k], 0) / PROTOCOL_KEYS.length,
  );

  const ratingHash = await hashString(
    canonicalJson({
      reviewId,
      actionableFeedback, deepEngagement, fairObjective,
      justifiedRecommendation, appropriateExpertise,
    }),
  );

  let commentHash: string | null = null;
  if (comment?.trim()) {
    commentHash = await hashString(canonicalJson({ comment, reviewId }));

    // Anchor comment hash to HCS
    await anchorToHcs("HCS_TOPIC_REVIEWS", {
      type: "author_comment",
      reviewId,
      commentHash,
      timestamp: new Date().toISOString(),
    });
  }

  const { serial } = await recordReputation(
    review.reviewerWallet,
    "author_rating",
    overallRating - 3, // 1→-2, 2→-1, 3→0, 4→+1, 5→+2
    `Author rating: ${overallRating}/5`,
    {
      type: "author_rating",
      protocols: {
        actionable_feedback: actionableFeedback,
        deep_engagement: deepEngagement,
        fair_objective: fairObjective,
        justified_recommendation: justifiedRecommendation,
        appropriate_expertise: appropriateExpertise,
      },
      overall: overallRating,
      reviewId,
    },
  );

  const [ratingRow] = await db
    .insert(reviewerRatings)
    .values({
      reviewId,
      actionableFeedback, deepEngagement, fairObjective,
      justifiedRecommendation, appropriateExpertise,
      overallRating,
      comment: comment?.trim() || null,
      commentHash,
      ratingHash,
      reputationTokenSerial: serial ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, ratingId: ratingRow?.id, overallRating });
}
