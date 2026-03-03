import { NextRequest, NextResponse } from "next/server";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import { publishCriteria } from "@/src/features/reviews/actions";
import { createNotification } from "@/src/features/notifications/actions";
import {
  requireSession,
  requireSubmissionEditor,
  anchorToHcs,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

interface ReviewCriterionInput {
  id: string;
  label: string;
  evaluationType: "yes_no_partially" | "scale_1_5";
  description?: string;
  required: boolean;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: submissionId } = await params;

  const submission = await requireSubmissionEditor(submissionId, session);
  if (submission instanceof NextResponse) return submission;

  if (submission.status !== "submitted") {
    return NextResponse.json(
      { error: "Criteria can only be published for submissions in 'submitted' status" },
      { status: 400 },
    );
  }

  const body = await req.json() as { criteria: ReviewCriterionInput[] };

  if (!body.criteria || body.criteria.length === 0) {
    return NextResponse.json({ error: "At least one criterion is required" }, { status: 400 });
  }

  const criteriaJson = canonicalJson(body.criteria);
  const criteriaHash = await hashString(criteriaJson);

  const { txId: hederaTxId } = await anchorToHcs("HCS_TOPIC_CRITERIA", {
    type: "criteria_published",
    submissionId,
    criteriaHash,
    timestamp: new Date().toISOString(),
  });

  const criteria = await publishCriteria({
    submissionId,
    criteriaJson,
    criteriaHash,
    hederaTxId,
  });

  if (!criteria) {
    return NextResponse.json({ error: "Failed to publish criteria" }, { status: 500 });
  }

  // Notify paper author
  if (submission.paper?.owner?.walletAddress) {
    await createNotification({
      userWallet: submission.paper.owner.walletAddress,
      type: "criteria_published",
      title: "Review criteria published",
      body: `Review criteria have been published for "${submission.paper.title}".`,
      link: `/researcher`,
    });
  }

  return NextResponse.json({ criteriaHash, hederaTxId });
}
