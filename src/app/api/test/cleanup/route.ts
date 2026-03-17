/**
 * Test-only DB cleanup endpoint for E2E tests.
 * Deletes all data created by a specific test run (identified by wallet address prefix).
 *
 * POST /api/test/cleanup
 * Body: { testRunId: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { like, inArray } from 'drizzle-orm';
import { db } from '@/src/shared/lib/db';
import { getErrorMessage } from '@/src/shared/lib/errors';
import { testRouteGuard } from '../guard';
import {
  users,
  papers,
  paperVersions,
  authorshipContracts,
  contractContributors,
  journals,
  submissions,
  reviewCriteria,
  reviewAssignments,
  reviews,
  rebuttals,
  rebuttalResponses,
  reputationEvents,
  reputationScores,
  badges,
  reviewerRatings,
  notifications,
  journalReviewers,
} from '@/src/shared/lib/db/schema';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const guardResponse = testRouteGuard();
  if (guardResponse) return guardResponse;

  const body = await request.json();
  const { testRunId } = body as { testRunId: string };

  if (!testRunId) {
    return NextResponse.json({ error: 'testRunId required' }, { status: 400 });
  }

  const prefix = testRunId.slice(0, 8);
  const walletPattern = `0x${prefix}%`;

  try {
    // Find all test users
    const testUsers = await db.query.users.findMany({
      where: like(users.walletAddress, walletPattern),
      columns: { id: true, walletAddress: true },
    });

    if (testUsers.length === 0) {
      return NextResponse.json({ ok: true, deleted: 0 });
    }

    const userIds = testUsers.map((u) => u.id);
    const userWallets = testUsers.map((u) => u.walletAddress);

    // Collect paper IDs and contracts in parallel (both depend only on userIds)
    const [testPapers, testContracts] = await Promise.all([
      db.query.papers.findMany({
        where: inArray(papers.ownerId, userIds),
        columns: { id: true },
      }),
      db.query.authorshipContracts.findMany({
        where: inArray(authorshipContracts.creatorId, userIds),
        columns: { id: true },
      }),
    ]);
    const paperIds = testPapers.map((p) => p.id);

    // Collect submission IDs
    let submissionIds: string[] = [];
    if (paperIds.length > 0) {
      const testSubs = await db.query.submissions.findMany({
        where: inArray(submissions.paperId, paperIds),
        columns: { id: true },
      });
      submissionIds = testSubs.map((s) => s.id);
    }

    // Collect review IDs and rebuttal IDs in parallel
    let reviewIds: string[] = [];
    let rebuttalIds: string[] = [];
    if (submissionIds.length > 0) {
      const [testReviews, testRebuttals] = await Promise.all([
        db.query.reviews.findMany({
          where: inArray(reviews.submissionId, submissionIds),
          columns: { id: true },
        }),
        db.query.rebuttals.findMany({
          where: inArray(rebuttals.submissionId, submissionIds),
          columns: { id: true },
        }),
      ]);
      reviewIds = testReviews.map((r) => r.id);
      rebuttalIds = testRebuttals.map((r) => r.id);
    }

    // Delete in reverse dependency order — parallelize independent branches
    await Promise.all([
      // Rebuttal branch
      rebuttalIds.length > 0
        ? db
            .delete(rebuttalResponses)
            .where(inArray(rebuttalResponses.rebuttalId, rebuttalIds))
            .then(() =>
              db.delete(rebuttals).where(inArray(rebuttals.id, rebuttalIds)),
            )
        : Promise.resolve(),
      // Review branch
      reviewIds.length > 0
        ? db
            .delete(reviewerRatings)
            .where(inArray(reviewerRatings.reviewId, reviewIds))
            .then(() =>
              db.delete(reviews).where(inArray(reviews.id, reviewIds)),
            )
        : Promise.resolve(),
    ]);

    if (submissionIds.length > 0) {
      // Assignments and criteria are independent of each other
      await Promise.all([
        db
          .delete(reviewAssignments)
          .where(inArray(reviewAssignments.submissionId, submissionIds)),
        db
          .delete(reviewCriteria)
          .where(inArray(reviewCriteria.submissionId, submissionIds)),
      ]);
      await db
        .delete(submissions)
        .where(inArray(submissions.id, submissionIds));
    }

    if (paperIds.length > 0) {
      await db
        .delete(paperVersions)
        .where(inArray(paperVersions.paperId, paperIds));
    }

    // Contracts
    if (testContracts.length > 0) {
      const contractIds = testContracts.map((c) => c.id);
      await db
        .delete(contractContributors)
        .where(inArray(contractContributors.contractId, contractIds));
      await db
        .delete(authorshipContracts)
        .where(inArray(authorshipContracts.id, contractIds));
    }

    if (paperIds.length > 0) {
      await db.delete(papers).where(inArray(papers.id, paperIds));
    }

    // Journals
    if (userWallets.length > 0) {
      const testJournals = await db.query.journals.findMany({
        where: inArray(journals.editorWallet, userWallets),
        columns: { id: true },
      });
      if (testJournals.length > 0) {
        const journalIds = testJournals.map((j) => j.id);
        await db
          .delete(journalReviewers)
          .where(inArray(journalReviewers.journalId, journalIds));
        await db.delete(journals).where(inArray(journals.id, journalIds));
      }
    }

    // Wallet-keyed tables — all independent
    await Promise.all([
      db.delete(badges).where(like(badges.userWallet, walletPattern)),
      db
        .delete(reputationEvents)
        .where(like(reputationEvents.userWallet, walletPattern)),
      db
        .delete(reputationScores)
        .where(like(reputationScores.userWallet, walletPattern)),
      db
        .delete(notifications)
        .where(like(notifications.userWallet, walletPattern)),
    ]);

    // Users last
    await db.delete(users).where(inArray(users.id, userIds));

    return NextResponse.json({ ok: true, deleted: userIds.length });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
