import { NextRequest, NextResponse, after } from 'next/server';
import {
  createReviewAssignment,
  updateSubmissionStatus,
  updateAssignmentTimelineIndex,
} from '@/src/features/reviews/actions';
import { listReviewAssignmentsForSubmission } from '@/src/features/reviews/queries';
import { createNotification } from '@/src/features/notifications/actions';
import {
  requireSession,
  requireSubmissionEditor,
  daysFromNow,
} from '@/src/shared/lib/api-helpers';
import { registerDeadline } from '@/src/shared/lib/hedera/timeline-enforcer';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id: submissionId } = await params;

  const submission = await requireSubmissionEditor(submissionId, session);
  if (submission instanceof NextResponse) return submission;

  const body = (await req.json()) as {
    reviewerWallets: string[];
    deadlineDays?: number;
  };

  if (!body.reviewerWallets || body.reviewerWallets.length === 0) {
    return NextResponse.json(
      { error: 'reviewerWallets is required' },
      { status: 400 },
    );
  }

  const deadlineDays = body.deadlineDays ?? submission.reviewDeadlineDays ?? 21;
  const deadline = daysFromNow(deadlineDays);

  const created = await Promise.all(
    body.reviewerWallets.map((wallet) =>
      createReviewAssignment({
        submissionId,
        reviewerWallet: wallet,
        deadline,
      }),
    ),
  );

  await updateSubmissionStatus(submissionId, 'reviewers_assigned');

  const allAssignments = await listReviewAssignmentsForSubmission(submissionId);

  // Notify paper author about reviewer assignment
  if (submission.paper?.owner?.walletAddress) {
    await createNotification({
      userWallet: submission.paper.owner.walletAddress,
      type: 'reviewers_assigned',
      title: 'Reviewers assigned',
      body: `${body.reviewerWallets.length} reviewer(s) have been assigned to "${submission.paper.title}".`,
      link: `/researcher`,
    });
  }

  // Notify each assigned reviewer in parallel
  await Promise.all(
    body.reviewerWallets.map((wallet) =>
      createNotification({
        userWallet: wallet,
        type: 'reviewers_assigned',
        title: 'New review assignment',
        body: `You have been assigned to review "${submission.paper?.title ?? 'a paper'}".`,
        link: `/reviewer`,
      }),
    ),
  );

  // Non-blocking: register deadlines on TimelineEnforcer smart contract
  after(async () => {
    await Promise.all(
      created.filter(Boolean).map(async (assignment) => {
        const result = await registerDeadline(
          submissionId,
          deadline,
          assignment!.reviewerWallet,
        );
        if (result) {
          await updateAssignmentTimelineIndex(assignment!.id, result.index);
        }
      }),
    );
  });

  return NextResponse.json({
    assignments: allAssignments,
    created: created.length,
  });
}
