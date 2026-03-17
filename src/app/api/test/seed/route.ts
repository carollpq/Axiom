/**
 * Test-only DB seeding endpoint for E2E tests.
 * Returns 404 in production or when ALLOW_TEST_AUTH is not set.
 *
 * POST /api/test/seed
 * Body: { scenario: string, testRunId: string }
 * Returns: { ok: true, data: { ...seeded entity IDs } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
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
  reputationScores,
  reputationEvents,
  badges,
} from '@/src/shared/lib/db/schema';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const guardResponse = testRouteGuard();
  if (guardResponse) return guardResponse;

  const body = await request.json();
  const { scenario, testRunId } = body as {
    scenario: string;
    testRunId: string;
  };

  if (!scenario || !testRunId) {
    return NextResponse.json(
      { error: 'scenario and testRunId required' },
      { status: 400 },
    );
  }

  // Use testRunId as prefix for wallet addresses to ensure isolation
  const prefix = testRunId.slice(0, 8);

  try {
    const data = await seedScenario(scenario, prefix, testRunId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// ── Scenario Implementations ────────────────────────────────────────────────

type SeedResult = Record<string, unknown>;

async function seedScenario(
  scenario: string,
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  switch (scenario) {
    case 'empty-researcher':
      return seedEmptyResearcher(prefix, testRunId);
    case 'researcher-with-papers':
      return seedResearcherWithPapers(prefix, testRunId);
    case 'researcher-with-contract':
      return seedResearcherWithContract(prefix, testRunId);
    case 'submitted-paper':
      return seedSubmittedPaper(prefix, testRunId);
    case 'editor-with-journal':
      return seedEditorWithJournal(prefix, testRunId);
    case 'criteria-published':
      return seedCriteriaPublished(prefix, testRunId);
    case 'reviewers-assigned':
      return seedReviewersAssigned(prefix, testRunId);
    case 'reviews-completed':
      return seedReviewsCompleted(prefix, testRunId);
    case 'rebuttal-open':
      return seedRebuttalOpen(prefix, testRunId);
    case 'reviewer-with-badges':
      return seedReviewerWithBadges(prefix, testRunId);
    default:
      throw new Error(`Unknown scenario: ${scenario}`);
  }
}

function wallet(prefix: string, role: string): string {
  return `0x${prefix}${role}`.toLowerCase().padEnd(42, '0');
}

// ── Scenario: empty-researcher ──────────────────────────────────────────────

async function seedEmptyResearcher(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const w = wallet(prefix, 'researcher');
  const [user] = await db
    .insert(users)
    .values({
      walletAddress: w,
      displayName: `Test Researcher ${prefix}`,
      institution: 'Test University',
      roles: ['researcher'],
      researchFields: ['Computer Science'],
    })
    .returning();

  return { testRunId, userWallet: w, userId: user.id };
}

// ── Scenario: researcher-with-papers ────────────────────────────────────────

async function seedResearcherWithPapers(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const w = wallet(prefix, 'researcher');
  const [user] = await db
    .insert(users)
    .values({
      walletAddress: w,
      displayName: `Test Researcher ${prefix}`,
      institution: 'Test University',
      roles: ['researcher'],
      researchFields: ['Computer Science'],
    })
    .returning();

  const [draftPaper] = await db
    .insert(papers)
    .values({
      title: `Draft Paper ${prefix}`,
      abstract: 'A test draft paper',
      status: 'draft',
      ownerId: user.id,
    })
    .returning();

  const [registeredPaper] = await db
    .insert(papers)
    .values({
      title: `Registered Paper ${prefix}`,
      abstract: 'A test registered paper',
      status: 'registered',
      ownerId: user.id,
    })
    .returning();

  const [version] = await db
    .insert(paperVersions)
    .values({
      paperId: registeredPaper.id,
      versionNumber: 1,
      paperHash: `hash_${prefix}_v1`,
    })
    .returning();

  return {
    testRunId,
    userWallet: w,
    userId: user.id,
    draftPaperId: draftPaper.id,
    registeredPaperId: registeredPaper.id,
    versionId: version.id,
  };
}

// ── Scenario: researcher-with-contract ──────────────────────────────────────

async function seedResearcherWithContract(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const base = await seedResearcherWithPapers(prefix, testRunId);
  const userId = base.userId as string;
  const w = base.userWallet as string;
  const paperId = base.registeredPaperId as string;

  const [journal] = await db
    .insert(journals)
    .values({
      name: `Test Journal ${prefix}`,
      editorWallet: wallet(prefix, 'editor__'),
    })
    .returning();

  const [contract] = await db
    .insert(authorshipContracts)
    .values({
      paperId,
      paperTitle: `Registered Paper ${prefix}`,
      status: 'fully_signed',
      creatorId: userId,
    })
    .returning();

  await db.insert(contractContributors).values({
    contractId: contract.id,
    contributorWallet: w,
    contributorName: `Test Researcher ${prefix}`,
    contributionPct: 100,
    status: 'signed',
    isCreator: true,
  });

  return {
    ...base,
    journalId: journal.id,
    contractId: contract.id,
  };
}

// ── Scenario: submitted-paper ───────────────────────────────────────────────

async function seedSubmittedPaper(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const base = await seedResearcherWithContract(prefix, testRunId);
  const paperId = base.registeredPaperId as string;
  const journalId = base.journalId as string;
  const versionId = base.versionId as string;

  const [submission] = await db
    .insert(submissions)
    .values({
      paperId,
      journalId,
      versionId,
      status: 'submitted',
    })
    .returning();

  return { ...base, submissionId: submission.id };
}

// ── Scenario: editor-with-journal ───────────────────────────────────────────

async function seedEditorWithJournal(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const editorW = wallet(prefix, 'editor__');
  const researcherW = wallet(prefix, 'researcher');

  // Users can be created in parallel
  const [[editor], [researcher]] = await Promise.all([
    db
      .insert(users)
      .values({
        walletAddress: editorW,
        displayName: `Test Editor ${prefix}`,
        institution: 'Test University',
        roles: ['editor'],
        researchFields: ['Computer Science'],
      })
      .returning(),
    db
      .insert(users)
      .values({
        walletAddress: researcherW,
        displayName: `Test Researcher ${prefix}`,
        institution: 'Test University',
        roles: ['researcher'],
        researchFields: ['Computer Science'],
      })
      .returning(),
  ]);

  // Journal depends on editor wallet, paper depends on researcher id
  const [[journal], [paper]] = await Promise.all([
    db
      .insert(journals)
      .values({
        name: `Test Journal ${prefix}`,
        editorWallet: editorW,
        aimsAndScope: 'A test journal for E2E testing',
      })
      .returning(),
    db
      .insert(papers)
      .values({
        title: `Submitted Paper ${prefix}`,
        abstract: 'A paper submitted for review',
        status: 'submitted',
        ownerId: researcher.id,
      })
      .returning(),
  ]);

  // Version and contract both depend on paper.id but not each other
  const [[version], [contract]] = await Promise.all([
    db
      .insert(paperVersions)
      .values({
        paperId: paper.id,
        versionNumber: 1,
        paperHash: `hash_${prefix}_submitted`,
      })
      .returning(),
    db
      .insert(authorshipContracts)
      .values({
        paperId: paper.id,
        paperTitle: `Submitted Paper ${prefix}`,
        status: 'fully_signed',
        creatorId: researcher.id,
      })
      .returning(),
  ]);

  const [submission] = await db
    .insert(submissions)
    .values({
      paperId: paper.id,
      journalId: journal.id,
      versionId: version.id,
      status: 'submitted',
    })
    .returning();

  return {
    testRunId,
    editorWallet: editorW,
    editorId: editor.id,
    journalId: journal.id,
    researcherWallet: researcherW,
    researcherId: researcher.id,
    paperId: paper.id,
    versionId: version.id,
    contractId: contract.id,
    submissionId: submission.id,
  };
}

// ── Scenario: criteria-published ────────────────────────────────────────────

async function seedCriteriaPublished(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const base = await seedEditorWithJournal(prefix, testRunId);
  const submissionId = base.submissionId as string;

  const criteriaJson = JSON.stringify([
    {
      id: 1,
      text: 'Is the methodology sound?',
      required: true,
      evaluationType: 'yes_no_partially',
    },
    {
      id: 2,
      text: 'Are the results reproducible?',
      required: true,
      evaluationType: 'yes_no_partially',
    },
    {
      id: 3,
      text: 'Is the literature review comprehensive?',
      required: false,
      evaluationType: 'yes_no_partially',
    },
  ]);

  const [criteria] = await db
    .insert(reviewCriteria)
    .values({
      submissionId,
      criteriaJson,
      criteriaHash: `criteria_hash_${prefix}`,
    })
    .returning();

  // Update submission status
  await db
    .update(submissions)
    .set({
      status: 'criteria_published',
      criteriaHash: `criteria_hash_${prefix}`,
    })
    .where(eq(submissions.id, submissionId));

  return { ...base, criteriaId: criteria.id, criteriaJson };
}

// ── Scenario: reviewers-assigned ────────────────────────────────────────────

async function seedReviewersAssigned(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const base = await seedCriteriaPublished(prefix, testRunId);
  const submissionId = base.submissionId as string;

  const reviewer1W = wallet(prefix, 'reviewer1');
  const reviewer2W = wallet(prefix, 'reviewer2');

  // Create both reviewers in parallel
  const [[reviewer1], [reviewer2]] = await Promise.all([
    db
      .insert(users)
      .values({
        walletAddress: reviewer1W,
        displayName: `Reviewer One ${prefix}`,
        institution: 'Review Institute',
        roles: ['reviewer'],
        researchFields: ['Computer Science'],
      })
      .returning(),
    db
      .insert(users)
      .values({
        walletAddress: reviewer2W,
        displayName: `Reviewer Two ${prefix}`,
        institution: 'Review Institute',
        roles: ['reviewer'],
        researchFields: ['Computer Science'],
      })
      .returning(),
  ]);

  const deadline = new Date(
    Date.now() + 21 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Create both assignments in parallel
  const [[assignment1], [assignment2]] = await Promise.all([
    db
      .insert(reviewAssignments)
      .values({
        submissionId,
        reviewerWallet: reviewer1W,
        status: 'accepted',
        deadline,
        acceptedAt: new Date().toISOString(),
      })
      .returning(),
    db
      .insert(reviewAssignments)
      .values({
        submissionId,
        reviewerWallet: reviewer2W,
        status: 'assigned',
        deadline,
      })
      .returning(),
  ]);

  // Update submission
  await db
    .update(submissions)
    .set({
      status: 'reviewers_assigned',
      reviewerWallets: [reviewer1W, reviewer2W],
      reviewDeadline: deadline,
    })
    .where(eq(submissions.id, submissionId));

  return {
    ...base,
    reviewer1Wallet: reviewer1W,
    reviewer1Id: reviewer1.id,
    reviewer2Wallet: reviewer2W,
    reviewer2Id: reviewer2.id,
    assignment1Id: assignment1.id,
    assignment2Id: assignment2.id,
    reviewDeadline: deadline,
  };
}

// ── Scenario: reviews-completed ─────────────────────────────────────────────

async function seedReviewsCompleted(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const base = await seedReviewersAssigned(prefix, testRunId);
  const submissionId = base.submissionId as string;
  const assignment1Id = base.assignment1Id as string;
  const assignment2Id = base.assignment2Id as string;
  const reviewer1W = base.reviewer1Wallet as string;
  const reviewer2W = base.reviewer2Wallet as string;

  // Accept assignment2 so both can submit
  await db
    .update(reviewAssignments)
    .set({ status: 'accepted', acceptedAt: new Date().toISOString() })
    .where(eq(reviewAssignments.id, assignment2Id));

  const criteriaEvals = JSON.stringify([
    { criterionId: 1, rating: 'Yes', comment: 'Sound methodology' },
    { criterionId: 2, rating: 'Yes', comment: 'Results are reproducible' },
    {
      criterionId: 3,
      rating: 'Partially',
      comment: 'Could be more comprehensive',
    },
  ]);

  // Create both reviews in parallel
  const [[review1], [review2]] = await Promise.all([
    db
      .insert(reviews)
      .values({
        submissionId,
        assignmentId: assignment1Id,
        reviewerWallet: reviewer1W,
        criteriaEvaluations: criteriaEvals,
        strengths: 'Strong methodology and clear writing',
        weaknesses: 'Limited sample size',
        questionsForAuthors: 'Can you elaborate on the limitations?',
        confidentialEditorComments: 'Good paper overall',
        recommendation: 'accept',
        reviewHash: `review_hash_${prefix}_1`,
      })
      .returning(),
    db
      .insert(reviews)
      .values({
        submissionId,
        assignmentId: assignment2Id,
        reviewerWallet: reviewer2W,
        criteriaEvaluations: criteriaEvals,
        strengths: 'Novel approach to the problem',
        weaknesses: 'Needs better statistical analysis',
        questionsForAuthors: 'What about edge cases?',
        confidentialEditorComments: 'Needs minor revisions',
        recommendation: 'minor_revisions',
        reviewHash: `review_hash_${prefix}_2`,
      })
      .returning(),
  ]);

  // Update assignments to submitted
  const now = new Date().toISOString();
  await Promise.all([
    db
      .update(reviewAssignments)
      .set({ status: 'submitted', submittedAt: now })
      .where(eq(reviewAssignments.id, assignment1Id)),
    db
      .update(reviewAssignments)
      .set({ status: 'submitted', submittedAt: now })
      .where(eq(reviewAssignments.id, assignment2Id)),
  ]);

  // Update submission
  await db
    .update(submissions)
    .set({ status: 'reviews_completed' })
    .where(eq(submissions.id, submissionId));

  return {
    ...base,
    review1Id: review1.id,
    review2Id: review2.id,
  };
}

// ── Scenario: rebuttal-open ─────────────────────────────────────────────────

async function seedRebuttalOpen(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const base = await seedReviewsCompleted(prefix, testRunId);
  const submissionId = base.submissionId as string;
  const researcherW = base.researcherWallet as string;

  // Set decision to rejected
  await db
    .update(submissions)
    .set({
      status: 'rebuttal_open',
      decision: 'reject',
      decisionJustification: 'Needs significant improvements',
      decidedAt: new Date().toISOString(),
      authorResponseStatus: 'rebuttal_requested',
    })
    .where(eq(submissions.id, submissionId));

  const deadline = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [rebuttal] = await db
    .insert(rebuttals)
    .values({
      submissionId,
      authorWallet: researcherW,
      status: 'open',
      deadline,
    })
    .returning();

  return {
    ...base,
    rebuttalId: rebuttal.id,
    rebuttalDeadline: deadline,
  };
}

// ── Scenario: reviewer-with-badges ──────────────────────────────────────────

async function seedReviewerWithBadges(
  prefix: string,
  testRunId: string,
): Promise<SeedResult> {
  const w = wallet(prefix, 'reviewer_');
  const [user] = await db
    .insert(users)
    .values({
      walletAddress: w,
      displayName: `Badge Reviewer ${prefix}`,
      institution: 'Review Institute',
      roles: ['reviewer'],
      researchFields: ['Computer Science', 'AI'],
    })
    .returning();

  await db.insert(reputationScores).values({
    userWallet: w,
    overallScore: 85,
    timelinessScore: 92,
    editorRatingAvg: 4,
    authorRatingAvg: 4,
    publicationScore: 3,
    reviewCount: 12,
  });

  const [event1] = await db
    .insert(reputationEvents)
    .values({
      userWallet: w,
      eventType: 'review_completed',
      scoreDelta: 1,
      details: 'Completed review for test paper',
    })
    .returning();

  await db.insert(badges).values([
    {
      userWallet: w,
      badgeType: 'first_review',
      achievementName: 'First Review Completed',
      reputationEventId: event1.id,
      metadata: { reviewCount: 1 },
    },
    {
      userWallet: w,
      badgeType: 'ten_reviews',
      achievementName: 'Ten Reviews Milestone',
      reputationEventId: event1.id,
      metadata: { reviewCount: 10 },
    },
    {
      userWallet: w,
      badgeType: 'high_reputation',
      achievementName: 'High Reputation',
      reputationEventId: event1.id,
      metadata: { score: 85 },
    },
  ]);

  return {
    testRunId,
    reviewerWallet: w,
    reviewerId: user.id,
  };
}
