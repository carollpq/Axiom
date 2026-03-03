import { NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { db } from "@/src/shared/lib/db";
import { submissions, reviews, rebuttals } from "@/src/shared/lib/db/schema";
import type { NotificationTypeDb, ReputationEventTypeDb } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { isHederaConfigured } from "@/src/shared/lib/hedera/client";
import { submitHcsMessage } from "@/src/shared/lib/hedera/hcs";
import { mintReputationToken } from "@/src/shared/lib/hedera/hts";
import { createReputationEvent } from "@/src/features/reviews/actions";
import { createNotification } from "@/src/features/notifications/actions";
import { getRebuttalById } from "@/src/features/rebuttals/queries";

/**
 * Auth guard — returns the lowercase wallet address or a 401 response.
 *
 * Usage:
 *   const session = await requireSession();
 *   if (session instanceof NextResponse) return session;
 *   // session is now `string` (wallet)
 */
export async function requireSession(): Promise<string | NextResponse> {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return wallet;
}

/**
 * Editor ownership check — verifies the submission exists and the session
 * wallet matches the journal's editor. Returns the submission (with journal
 * and paper owner) or a 404/403 response.
 */
export async function requireSubmissionEditor(
  submissionId: string,
  wallet: string,
) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { journal: true, paper: { with: { owner: true } } },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (
    submission.journal.editorWallet.toLowerCase() !== wallet.toLowerCase()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return submission;
}

type HcsTopicEnvVar =
  | "HCS_TOPIC_PAPERS"
  | "HCS_TOPIC_CONTRACTS"
  | "HCS_TOPIC_SUBMISSIONS"
  | "HCS_TOPIC_CRITERIA"
  | "HCS_TOPIC_REVIEWS"
  | "HCS_TOPIC_DECISIONS"
  | "HCS_TOPIC_RETRACTIONS";

/**
 * Anchor a JSON payload to an HCS topic with graceful fallback.
 * Returns `{ txId, consensusTimestamp }` if successful, empty object otherwise.
 */
export async function anchorToHcs(
  topicEnvVar: HcsTopicEnvVar,
  payload: Record<string, unknown>,
  label = "HCS",
): Promise<{ txId?: string; consensusTimestamp?: string }> {
  const topicId = process.env[topicEnvVar];
  if (!isHederaConfigured() || !topicId) return {};

  try {
    const { txId, consensusTimestamp } = await submitHcsMessage(
      topicId,
      payload,
    );
    return { txId, consensusTimestamp };
  } catch (err) {
    console.error(`[${label}] Anchor failed:`, err);
    return {};
  }
}

/**
 * Mint an HTS reputation token and create the corresponding reputation event.
 * Handles all error cases gracefully.
 */
export async function recordReputation(
  wallet: string,
  eventType: ReputationEventTypeDb,
  scoreDelta: number,
  details: string,
  mintMetadata: Record<string, unknown>,
): Promise<{ serial?: string; txId?: string }> {
  let serial: string | undefined;
  let txId: string | undefined;

  try {
    const result = await mintReputationToken(wallet, mintMetadata);
    serial = result?.serial;
    txId = result?.txId;
  } catch (err) {
    console.error("[HTS] Reputation token mint failed:", err);
  }

  await createReputationEvent({
    userWallet: wallet,
    eventType,
    scoreDelta,
    details,
    htsTokenSerial: serial,
    hederaTxId: txId,
  });

  return { serial, txId };
}

/**
 * Compute a deadline ISO string from now + N days.
 */
export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

/**
 * Rebuttal author guard — verifies the rebuttal exists and the session
 * wallet matches the author. Uses a lighter query (no responses relation).
 */
export async function requireRebuttalAuthor(
  rebuttalId: string,
  wallet: string,
) {
  const rebuttal = await db.query.rebuttals.findFirst({
    where: eq(rebuttals.id, rebuttalId),
    with: {
      submission: {
        with: {
          paper: { with: { owner: true } },
          journal: true,
        },
      },
    },
  });

  if (!rebuttal) {
    return NextResponse.json(
      { error: "Rebuttal not found" },
      { status: 404 },
    );
  }

  if (rebuttal.authorWallet.toLowerCase() !== wallet.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return rebuttal;
}

/**
 * Rebuttal editor guard — verifies the rebuttal exists and the session
 * wallet matches the journal's editor. Returns the full rebuttal (with
 * responses) via `getRebuttalById`.
 */
export async function requireRebuttalEditor(
  rebuttalId: string,
  wallet: string,
) {
  const rebuttal = await getRebuttalById(rebuttalId);

  if (!rebuttal) {
    return NextResponse.json(
      { error: "Rebuttal not found" },
      { status: 404 },
    );
  }

  if (!rebuttal.submission?.journal) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (
    rebuttal.submission.journal.editorWallet.toLowerCase() !==
    wallet.toLowerCase()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return rebuttal;
}

/**
 * Review + paper owner guard — verifies the review exists and the session
 * wallet owns the paper. Returns the review (with submission.paper.owner) or 404/403.
 */
export async function requireReviewWithPaperOwner(
  reviewId: string,
  wallet: string,
) {
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
    with: {
      submission: {
        with: { paper: { with: { owner: true } } },
      },
    },
  });

  if (!review) {
    return NextResponse.json(
      { error: "Review not found" },
      { status: 404 },
    );
  }

  if (
    review.submission.paper.owner.walletAddress.toLowerCase() !==
    wallet.toLowerCase()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return review;
}

/**
 * Anchor a payload to HCS and fire notifications in parallel.
 * Routes still own their DB mutations (those vary too much to generalize).
 */
export async function anchorAndNotify(opts: {
  topic: HcsTopicEnvVar;
  payload: Record<string, unknown>;
  notifications: Array<{
    userWallet: string;
    type: NotificationTypeDb;
    title: string;
    body: string;
    link?: string;
  }>;
}): Promise<{ txId?: string; consensusTimestamp?: string }> {
  const [hcsResult] = await Promise.all([
    anchorToHcs(opts.topic, opts.payload),
    ...opts.notifications.map((n) => createNotification(n)),
  ]);

  return hcsResult;
}
