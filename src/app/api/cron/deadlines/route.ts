import { NextRequest, NextResponse, after } from 'next/server';
import { listOverdueAssignments } from '@/src/features/reviews/queries';
import { markAssignmentLate } from '@/src/features/reviews/actions';
import { createNotification } from '@/src/features/notifications/actions';
import { recordReputation } from '@/src/shared/lib/api-helpers';
import { checkDeadline } from '@/src/shared/lib/hedera/timeline-enforcer';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const overdue = await listOverdueAssignments();
  let processed = 0;

  for (const assignment of overdue) {
    await markAssignmentLate(assignment.id);
    processed++;
  }

  // Non-blocking: reputation minting + notifications run after response
  after(async () => {
    for (const assignment of overdue) {
      // Cross-verify with on-chain TimelineEnforcer (chain as source of truth)
      if (assignment.timelineEnforcerIndex != null) {
        const onChain = await checkDeadline(
          assignment.submissionId,
          assignment.timelineEnforcerIndex,
        );
        if (onChain && !onChain.isOverdue) {
          console.warn(
            `[Cron] Contract says NOT overdue for assignment ${assignment.id} — skipping reputation penalty (chain is source of truth)`,
          );
          continue;
        }
      }

      await Promise.all([
        recordReputation(
          assignment.reviewerWallet,
          'review_late',
          -2,
          `Late review for submission ${assignment.submissionId}`,
          {
            type: 'review_late',
            assignmentId: assignment.id,
            submissionId: assignment.submissionId,
          },
        ),
        createNotification({
          userWallet: assignment.reviewerWallet,
          type: 'review_late',
          title: 'Review overdue',
          body: `Your review for "${assignment.submission.paper.title}" is past deadline.`,
          link: `/reviewer`,
        }),
        ...(assignment.submission.journal?.editorWallet
          ? [
              createNotification({
                userWallet: assignment.submission.journal.editorWallet,
                type: 'review_late',
                title: 'Reviewer overdue',
                body: `A reviewer is past deadline for "${assignment.submission.paper.title}".`,
                link: `/editor/under-review`,
              }),
            ]
          : []),
      ]);
    }
  });

  return NextResponse.json({ processed });
}
