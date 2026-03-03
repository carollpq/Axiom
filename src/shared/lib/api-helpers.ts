import { NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { db } from "@/src/shared/lib/db";
import { submissions } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { isHederaConfigured } from "@/src/shared/lib/hedera/client";
import { submitHcsMessage } from "@/src/shared/lib/hedera/hcs";
import { mintReputationToken } from "@/src/shared/lib/hedera/hts";
import { createReputationEvent } from "@/src/features/reviews/actions";

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
type ReputationEventType =
  | "review_completed"
  | "review_late"
  | "editor_rating"
  | "author_rating"
  | "paper_published"
  | "paper_retracted"
  | "rebuttal_upheld"
  | "rebuttal_overturned";

export async function recordReputation(
  wallet: string,
  eventType: ReputationEventType,
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
