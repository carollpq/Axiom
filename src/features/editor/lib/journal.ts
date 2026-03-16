// Pure mapping & utility functions for the editor feature.
// All DB-to-display transforms live here so page.tsx files stay thin.

import type {
  JournalSubmission,
  SubmissionStage,
  PoolReviewer,
  PaperCardData,
  ReviewerWithStatus,
  EditorProfile,
  JournalIssue,
} from '@/src/features/editor/types';
import type {
  DbJournalSubmission,
  DbReviewer,
  DbReputationScore,
  DbJournalIssue,
  DbJournalReviewerWithStatus,
} from '../queries';
import type { StatCardProps } from '@/src/shared/types/shared';
import { formatDate, truncate } from '@/src/shared/lib/format';
import { displayNameOrWallet } from '@/src/features/users/lib';
import { toFivePointScale } from '@/src/features/reviews/lib';

/** Buckets submissions into 5 stat cards by pipeline status. */
export function computeSubmissionStats(
  subs: DbJournalSubmission[],
): StatCardProps[] {
  let newSubmissions = 0,
    awaitingAssignment = 0,
    underReview = 0,
    accepted = 0,
    rejected = 0;

  for (const s of subs) {
    switch (s.status) {
      case 'submitted':
      case 'viewed_by_editor':
        newSubmissions++;
        break;
      case 'criteria_published':
      case 'reviewers_assigned': {
        const acceptedCount = (s.reviewAssignments ?? []).filter(
          (a: { status: string }) =>
            a.status === 'accepted' || a.status === 'submitted',
        ).length;
        if (s.status === 'reviewers_assigned' && acceptedCount >= 2)
          underReview++;
        else awaitingAssignment++;
        break;
      }
      case 'under_review':
      case 'reviews_completed':
      case 'rebuttal_open':
        underReview++;
        break;
      case 'accepted':
      case 'published':
        accepted++;
        break;
      case 'rejected':
        rejected++;
        break;
    }
  }

  return [
    { label: 'New Submissions', value: newSubmissions },
    { label: 'Awaiting Assignment', value: awaitingAssignment },
    { label: 'Under Review', value: underReview },
    { label: 'Accepted Papers', value: accepted },
    { label: 'Rejected Papers', value: rejected, alert: true },
  ];
}

/** Maps DB status + criteria/reviewer/decision state to a display stage. */
export function deriveStage(
  status: string,
  criteriaHash: string | null,
  reviewerWallets: string[],
  criteriaMet: boolean | null,
  decision: string | null,
): SubmissionStage {
  if (status === 'published') return 'Published';
  if (status === 'rejected') return 'Rejected';
  if (status === 'reviews_completed') return 'Decision Pending';
  if (status === 'under_review') {
    if (criteriaMet !== null || decision !== null) return 'Decision Pending';
    return 'Under Review';
  }
  if (status === 'rebuttal_open') return 'Under Review';
  // "submitted" / "viewed_by_editor" / "revision_requested"
  if (reviewerWallets.length > 0) return 'Reviewers Assigned';
  if (criteriaHash) return 'Criteria Published';
  return 'New';
}

/** Maps a DB submission row to the display-friendly JournalSubmission shape. */
export function mapDbToJournalSubmission(
  s: DbJournalSubmission,
  index: number,
): JournalSubmission {
  const latestVersion = s.paper.versions?.at(-1);
  const hash = latestVersion ? truncate(latestVersion.paperHash, 8) : '—';
  const wallets = (s.reviewerWallets as string[] | null) ?? [];

  return {
    id: index + 1,
    title: s.paper.title,
    authors: s.paper.owner?.displayName ?? 'Unknown',
    submitted: formatDate(s.submittedAt),
    stage: deriveStage(
      s.status,
      s.criteriaHash ?? null,
      wallets,
      s.criteriaMet ?? null,
      s.decision ?? null,
    ),
    reviewers: wallets,
    deadline: s.reviewDeadline ?? null,
    criteriaPublished: !!s.criteriaHash,
    criteriaMet: s.criteriaMet ?? null,
    hash,
  };
}

/** Maps a DB reviewer + optional reputation score to a PoolReviewer display object. */
export function mapDbToPoolReviewer(
  u: DbReviewer,
  scoreRow?: DbReputationScore | null,
): PoolReviewer {
  const fields = (u.researchFields as string[] | null) ?? [];
  return {
    id: String(u.id),
    name: String(u.displayName ?? u.walletAddress),
    field: fields[0] ?? '—',
    score: scoreRow ? toFivePointScale(scoreRow.overallScore) : 0,
    orcid: String(u.orcidId ?? '—'),
    reviews: scoreRow?.reviewCount ?? 0,
    wallet: String(u.walletAddress),
    institution: String(u.institution ?? '—'),
  };
}

/** Truncates abstract and resolves file URL (skips Lit-encrypted papers). */
export function mapDbToPaperCardData(s: DbJournalSubmission): PaperCardData {
  const abstract = s.paper.abstract ?? '';
  const submittedDate = s.submittedAt ? formatDate(String(s.submittedAt)) : '—';
  const hasLitData = !!(
    s.paper.litDataToEncryptHash && s.paper.litAccessConditionsJson
  );
  const latestVersion = s.paper.versions?.at(-1);
  const hasFile = !!latestVersion?.fileStorageKey;
  return {
    id: s.id,
    paperId: s.paper.id,
    title: s.paper.title,
    authors:
      s.paper.owner?.displayName ?? s.paper.owner?.walletAddress ?? 'Unknown',
    abstractSnippet:
      abstract.length > 180 ? abstract.slice(0, 177) + '…' : abstract,
    submittedDate,
    hasLitData,
    fileUrl:
      !hasLitData && hasFile
        ? `/api/papers/${s.paper.id}/content?format=raw`
        : undefined,
    criteriaPublished: (s.reviewCriteria?.length ?? 0) > 0,
  };
}

/** Joins reviewers with their reputation scores by wallet address. */
export function buildReviewerPool(
  reviewers: DbReviewer[],
  scores: DbReputationScore[],
): PoolReviewer[] {
  const scoreByWallet = Object.fromEntries(
    scores.map((s) => [s.userWallet, s]),
  );
  return reviewers.map((u) =>
    mapDbToPoolReviewer(u, scoreByWallet[u.walletAddress as string]),
  );
}

/** Creates a wallet→displayName lookup from a list of reviewer DB rows. */
export function buildNameByWallet(
  reviewers: DbReviewer[],
): Record<string, string> {
  return Object.fromEntries(
    reviewers.map((u) => [
      u.walletAddress as string,
      (u.displayName ?? u.walletAddress) as string,
    ]),
  );
}

export function mapDbToEditorProfile(
  user: { displayName: string | null; institution: string | null } | null,
  journal: { name: string } | null,
  getInitialsFn: (name: string) => string,
): EditorProfile {
  const name = user?.displayName ?? 'Editor';
  return {
    name,
    initials: getInitialsFn(name),
    affiliation: user?.institution ?? '—',
    journalName: journal?.name ?? '—',
  };
}

/** Maps assignment DB status (assigned/accepted/submitted/declined) to display status. */
export function mapDbToReviewerWithStatus(
  assignment: { id: string; reviewerWallet: string; status: string },
  nameByWallet?: Record<string, string>,
): ReviewerWithStatus {
  const statusMap: Record<string, ReviewerWithStatus['status']> = {
    assigned: 'pending',
    accepted: 'in_progress',
    submitted: 'complete',
    declined: 'rejected',
    late: 'late',
  };
  const name =
    nameByWallet?.[assignment.reviewerWallet] ??
    displayNameOrWallet(null, assignment.reviewerWallet);
  return {
    id: assignment.id,
    name,
    status: statusMap[assignment.status] ?? 'pending',
    hasComment: assignment.status === 'submitted',
  };
}

/** Maps a DB issue (with nested paper joins) to a display-friendly JournalIssue. */
export function mapDbToJournalIssue(dbIssue: DbJournalIssue): JournalIssue {
  const papers = (dbIssue.papers ?? []).map((ip) => ({
    submissionId: ip.submissionId,
    title: ip.submission?.paper?.title ?? 'Untitled',
  }));
  return {
    id: dbIssue.id,
    label: dbIssue.label,
    paperCount: papers.length,
    papers,
  };
}

/** Splits the global reviewer list into pool members vs non-members for this journal. */
export function filterPoolByJournal(
  allReviewers: PoolReviewer[],
  poolWalletSet: Set<string>,
): { poolReviewers: PoolReviewer[]; nonPoolReviewers: PoolReviewer[] } {
  const poolReviewers: PoolReviewer[] = [];
  const nonPoolReviewers: PoolReviewer[] = [];
  for (const r of allReviewers) {
    if (poolWalletSet.has(r.wallet.toLowerCase())) {
      poolReviewers.push(r);
    } else {
      nonPoolReviewers.push(r);
    }
  }
  return { poolReviewers, nonPoolReviewers };
}

/** Maps DB rows (reviewer + user + score joins) to PoolReviewer display objects. */
export function buildPoolReviewersWithStatus(
  reviewerRows: DbJournalReviewerWithStatus[],
): PoolReviewer[] {
  return reviewerRows.map((row) => ({
    id: row.id,
    name: row.user?.displayName ?? displayNameOrWallet(null, row.wallet),
    field: ((row.user?.researchFields as string[] | null) ?? [])[0] ?? '—',
    score: row.score ? toFivePointScale(row.score.overallScore) : 0,
    orcid: row.user?.orcidId ?? '—',
    reviews: row.score?.reviewCount ?? 0,
    wallet: row.wallet,
    institution: row.user?.institution ?? '—',
    poolInviteStatus: row.status as 'pending' | 'accepted' | 'rejected',
  }));
}

// ---------------------------------------------------------------------------
// Shared helpers used across multiple editor page.tsx files
// ---------------------------------------------------------------------------

/** Builds a submissionId → ReviewerWithStatus[] map from submissions.
 *  When `includeReviewContent` is true, attaches strengths/weaknesses/recommendation
 *  from completed reviews (used on the accepted page). */
export function buildReviewStatusMap(
  submissions: DbJournalSubmission[],
  nameByWallet: Record<string, string>,
  options?: { includeReviewContent?: boolean },
): Record<string, ReviewerWithStatus[]> {
  const result: Record<string, ReviewerWithStatus[]> = {};

  for (const s of submissions) {
    if (!s.reviewAssignments?.length) continue;

    // Pre-index review content by assignmentId when needed
    const reviewByAssignment =
      options?.includeReviewContent && s.reviews
        ? Object.fromEntries(
            s.reviews.map((rev) => [
              rev.assignmentId,
              {
                strengths: rev.strengths,
                weaknesses: rev.weaknesses,
                recommendation: rev.recommendation,
              },
            ]),
          )
        : null;

    result[s.id] = (
      s.reviewAssignments as {
        id: string;
        reviewerWallet: string;
        status: string;
      }[]
    ).map((a) => {
      const mapped = mapDbToReviewerWithStatus(a, nameByWallet);
      if (reviewByAssignment) {
        const content = reviewByAssignment[a.id];
        if (content) mapped.reviewContent = content;
      }
      return mapped;
    });
  }

  return result;
}
