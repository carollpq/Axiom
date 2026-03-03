import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { db } from "@/src/shared/lib/db";
import { submissions } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";
import { createReviewAssignment, updateSubmissionStatus } from "@/src/features/reviews/actions";
import { listReviewAssignmentsForSubmission } from "@/src/features/reviews/queries";
import { createNotification } from "@/src/features/notifications/actions";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionWallet = await getSession();
  if (!sessionWallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: submissionId } = await params;

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

  const body = await req.json() as { reviewerWallets: string[]; deadlineDays?: number };

  if (!body.reviewerWallets || body.reviewerWallets.length === 0) {
    return NextResponse.json({ error: "reviewerWallets is required" }, { status: 400 });
  }

  const deadlineDays = body.deadlineDays ?? submission.reviewDeadlineDays ?? 21;
  const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString();

  const created = await Promise.all(
    body.reviewerWallets.map(wallet =>
      createReviewAssignment({ submissionId, reviewerWallet: wallet, deadline }),
    ),
  );

  await updateSubmissionStatus(submissionId, "reviewers_assigned");

  const allAssignments = await listReviewAssignmentsForSubmission(submissionId);

  // Notify paper author about reviewer assignment
  if (submission.paper?.owner?.walletAddress) {
    await createNotification({
      userWallet: submission.paper.owner.walletAddress,
      type: "reviewers_assigned",
      title: "Reviewers assigned",
      body: `${body.reviewerWallets.length} reviewer(s) have been assigned to "${submission.paper.title}".`,
      link: `/researcher`,
    });
  }

  // Notify each assigned reviewer in parallel
  await Promise.all(
    body.reviewerWallets.map((wallet) =>
      createNotification({
        userWallet: wallet,
        type: "reviewers_assigned",
        title: "New review assignment",
        body: `You have been assigned to review "${submission.paper?.title ?? "a paper"}".`,
        link: `/reviewer`,
      }),
    ),
  );

  return NextResponse.json({ assignments: allAssignments, created: created.length });
}
