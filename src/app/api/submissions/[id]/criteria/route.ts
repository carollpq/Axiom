import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { db } from "@/src/shared/lib/db";
import { submissions, journals } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import { publishCriteria } from "@/src/features/reviews/actions";
import { isHederaConfigured } from "@/src/shared/lib/hedera/client";
import { submitHcsMessage } from "@/src/shared/lib/hedera/hcs";
import { createNotification } from "@/src/features/notifications/actions";

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
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: submissionId } = await params;

  // Verify submission exists and editor owns the journal
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { journal: true, paper: { with: { owner: true } } },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.journal.editorWallet.toLowerCase() !== sessionWallet.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  let hederaTxId: string | undefined;

  if (isHederaConfigured() && process.env.HCS_TOPIC_CRITERIA) {
    try {
      const { txId } = await submitHcsMessage(process.env.HCS_TOPIC_CRITERIA, {
        type: "criteria_published",
        submissionId,
        criteriaHash,
        timestamp: new Date().toISOString(),
      });
      hederaTxId = txId;
    } catch (err) {
      console.error("[HCS] Criteria anchor failed:", err);
    }
  }

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
