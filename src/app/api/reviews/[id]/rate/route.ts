import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/shared/lib/db";
import { reviewerRatings } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import {
  requireSession,
  requireReviewWithPaperOwner,
  anchorToHcs,
  recordReputation,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

interface RatingBody {
  actionableFeedback: number;
  deepEngagement: number;
  fairObjective: number;
  justifiedRecommendation: number;
  appropriateExpertise: number;
  comment?: string;
}

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

  const body = (await req.json()) as RatingBody;

  // Validate each protocol is integer 1-5
  for (const key of PROTOCOL_KEYS) {
    const val = body[key];
    if (!val || !Number.isInteger(val) || val < 1 || val > 5) {
      return NextResponse.json(
        { error: `${key} must be an integer 1-5` },
        { status: 400 },
      );
    }
  }

  // Check if already rated
  const existing = await db.query.reviewerRatings.findFirst({
    where: eq(reviewerRatings.reviewId, reviewId),
  });
  if (existing) {
    return NextResponse.json({ error: "Review already rated" }, { status: 409 });
  }

  const overallRating = Math.round(
    PROTOCOL_KEYS.reduce((sum, k) => sum + body[k], 0) / PROTOCOL_KEYS.length,
  );

  const ratingHash = await hashString(
    canonicalJson({
      reviewId,
      actionableFeedback: body.actionableFeedback,
      deepEngagement: body.deepEngagement,
      fairObjective: body.fairObjective,
      justifiedRecommendation: body.justifiedRecommendation,
      appropriateExpertise: body.appropriateExpertise,
    }),
  );

  let commentHash: string | null = null;
  if (body.comment?.trim()) {
    commentHash = await hashString(canonicalJson({ comment: body.comment, reviewId }));

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
        actionable_feedback: body.actionableFeedback,
        deep_engagement: body.deepEngagement,
        fair_objective: body.fairObjective,
        justified_recommendation: body.justifiedRecommendation,
        appropriate_expertise: body.appropriateExpertise,
      },
      overall: overallRating,
      reviewId,
    },
  );

  const [ratingRow] = await db
    .insert(reviewerRatings)
    .values({
      reviewId,
      actionableFeedback: body.actionableFeedback,
      deepEngagement: body.deepEngagement,
      fairObjective: body.fairObjective,
      justifiedRecommendation: body.justifiedRecommendation,
      appropriateExpertise: body.appropriateExpertise,
      overallRating,
      comment: body.comment?.trim() || null,
      commentHash,
      ratingHash,
      reputationTokenSerial: serial ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, ratingId: ratingRow?.id, overallRating });
}
