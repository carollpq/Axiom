'use server';

import { z } from 'zod';
import { after } from 'next/server';
import type {
  RebuttalPositionDb,
  RebuttalResolutionDb,
} from '@/src/shared/lib/db/schema';
import { canonicalJson, sha256 } from '@/src/shared/lib/hashing';
import {
  requireAuth,
  requireRebuttalAuthor,
  requireRebuttalEditor,
  anchorAndNotify,
  recordReputation,
} from '@/src/shared/lib/server-action-helpers';
import {
  submitRebuttalResponses,
  resolveRebuttal,
} from '@/src/features/rebuttals/mutations';

// ---------------------------------------------------------------------------
// Respond to Rebuttal
// ---------------------------------------------------------------------------

const respondSchema = z.object({
  responses: z
    .array(
      z.object({
        reviewId: z.string().min(1),
        criterionId: z.string().nullish(),
        position: z.enum(['agree', 'disagree'] as [
          RebuttalPositionDb,
          ...RebuttalPositionDb[],
        ]),
        justification: z.string().trim().min(10).max(10_000),
        evidence: z.string().trim().max(10_000).nullish(),
      }),
    )
    .min(1)
    .max(50),
});

export async function respondToRebuttalAction(
  rebuttalId: string,
  input: z.infer<typeof respondSchema>,
) {
  const session = await requireAuth();

  const rebuttal = await requireRebuttalAuthor(rebuttalId, session);

  if (rebuttal.status !== 'open') {
    throw new Error('Rebuttal is not open for responses');
  }

  if (new Date(rebuttal.deadline) < new Date()) {
    throw new Error('Rebuttal deadline has passed');
  }

  const parsed = respondSchema.parse(input);
  const rebuttalHash = await sha256(canonicalJson(parsed.responses));

  const editorWallet = rebuttal.submission?.journal?.editorWallet;

  const { txId: hederaTxId } = await anchorAndNotify({
    topic: 'HCS_TOPIC_DECISIONS',
    payload: {
      type: 'rebuttal_submitted',
      rebuttalId,
      submissionId: rebuttal.submissionId,
      rebuttalHash,
      timestamp: new Date().toISOString(),
    },
    notifications: editorWallet
      ? [
          {
            userWallet: editorWallet,
            type: 'rebuttal_submitted',
            title: 'Rebuttal response submitted',
            body: `The author has responded to the rebuttal for "${rebuttal.submission.paper?.title}".`,
            link: `/editor/under-review`,
          },
        ]
      : [],
  });

  const responses = parsed.responses.map((r) => ({
    ...r,
    rebuttalId,
  }));

  await submitRebuttalResponses(
    rebuttalId,
    responses,
    rebuttalHash,
    hederaTxId,
  );

  return { rebuttalHash, hederaTxId };
}

// ---------------------------------------------------------------------------
// Resolve Rebuttal
// ---------------------------------------------------------------------------

export async function resolveRebuttalAction(
  rebuttalId: string,
  resolution: RebuttalResolutionDb,
  editorNotes: string,
) {
  const session = await requireAuth();

  const rebuttal = await requireRebuttalEditor(rebuttalId, session);

  if (rebuttal.status !== 'submitted') {
    throw new Error('Rebuttal must be submitted before resolving');
  }

  const { txId: hederaTxId } = await anchorAndNotify({
    topic: 'HCS_TOPIC_DECISIONS',
    payload: {
      type: 'rebuttal_resolved',
      rebuttalId,
      submissionId: rebuttal.submissionId,
      resolution,
      timestamp: new Date().toISOString(),
    },
    notifications: rebuttal.authorWallet
      ? [
          {
            userWallet: rebuttal.authorWallet,
            type: 'rebuttal_resolved',
            title: 'Rebuttal resolved',
            body: `Your rebuttal has been resolved: ${resolution}. ${editorNotes || ''}`.trim(),
            link: `/researcher/rebuttal/${rebuttal.submissionId}`,
          },
        ]
      : [],
  });

  await resolveRebuttal({
    rebuttalId,
    resolution,
    editorNotes,
    hederaTxId,
  });

  // Non-blocking: reputation minting
  after(async () => {
    const reviewerWallets = new Set(
      rebuttal.responses.map((r) => r.review.reviewerWallet),
    );

    const eventType =
      resolution === 'upheld'
        ? ('rebuttal_upheld' as const)
        : ('rebuttal_overturned' as const);
    const scoreDelta =
      resolution === 'upheld' ? -2 : resolution === 'rejected' ? 1 : 0;

    await Promise.all(
      [...reviewerWallets].map((reviewerWallet) =>
        recordReputation(
          reviewerWallet,
          eventType,
          scoreDelta,
          `Rebuttal ${resolution} for submission ${rebuttal.submissionId}`,
          { type: eventType, rebuttalId, resolution },
        ),
      ),
    );
  });

  return { resolution, hederaTxId };
}
