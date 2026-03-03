import { NextRequest, NextResponse } from "next/server";
import { openRebuttal } from "@/src/features/rebuttals/actions";
import { updateSubmissionStatus } from "@/src/features/reviews/actions";
import { createNotification } from "@/src/features/notifications/actions";
import {
  requireSession,
  requireSubmissionEditor,
  anchorToHcs,
  daysFromNow,
} from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: submissionId } = await params;

  const submission = await requireSubmissionEditor(submissionId, session);
  if (submission instanceof NextResponse) return submission;

  const deadline = daysFromNow(14);

  const { txId: hederaTxId } = await anchorToHcs("HCS_TOPIC_DECISIONS", {
    type: "rebuttal_opened",
    submissionId,
    deadline,
    timestamp: new Date().toISOString(),
  });

  const authorWallet = submission.paper.owner?.walletAddress ?? "";

  const rebuttal = await openRebuttal({
    submissionId,
    authorWallet,
    deadline,
    hederaTxId,
  });

  await updateSubmissionStatus(submissionId, "rebuttal_open");

  if (authorWallet) {
    await createNotification({
      userWallet: authorWallet,
      type: "rebuttal_opened",
      title: "Rebuttal phase opened",
      body: `The editor has opened a rebuttal phase for "${submission.paper.title}". You have 14 days to respond.`,
      link: `/researcher/rebuttal/${submissionId}`,
    });
  }

  return NextResponse.json({ rebuttalId: rebuttal?.id, deadline, hederaTxId });
}
