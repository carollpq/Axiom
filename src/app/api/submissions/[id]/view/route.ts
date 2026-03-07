import { NextRequest, NextResponse } from "next/server";
import { updateSubmissionStatus } from "@/src/features/reviews/actions";
import {
  requireSession,
  requireSubmissionEditor,
  anchorAndNotify,
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

  // Only transition from "submitted" → "viewed_by_editor" (idempotent for other states)
  if (submission.status !== "submitted") {
    return NextResponse.json({ status: submission.status, alreadyViewed: true });
  }

  await updateSubmissionStatus(submissionId, "viewed_by_editor");

  const authorWallet = submission.paper.owner?.walletAddress ?? "";

  await anchorAndNotify({
    topic: "HCS_TOPIC_SUBMISSIONS",
    payload: {
      type: "viewed_by_editor",
      submissionId,
      editorWallet: session,
      timestamp: new Date().toISOString(),
    },
    notifications: authorWallet
      ? [
          {
            userWallet: authorWallet,
            type: "submission_viewed",
            title: "Paper viewed by editor",
            body: `Your paper "${submission.paper.title}" has been viewed by the editor.`,
            link: `/researcher`,
          },
        ]
      : [],
  });

  return NextResponse.json({ status: "viewed_by_editor" });
}
