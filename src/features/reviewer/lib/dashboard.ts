import type { PaperListItemData } from '@/src/shared/components/paper-list-item';
import type {
  AssignedReview,
  AssignedReviewExtended,
  CompletedReview,
  CompletedReviewExtended,
  ResearcherInsight,
  ReviewerDisplayStatus,
  ReputationScores,
  ReputationBreakdownItem,
} from '@/src/features/reviewer/types/dashboard';
import type {
  DbAssignedReview,
  DbCompletedReview,
  DbCompletedReviewExtended,
  DbReputationRow,
} from '../queries';
import { formatDate, truncate } from '@/src/shared/lib/format';
import { toFivePointScale } from '@/src/features/reviews/lib';

/** Wallet address → display name lookup, built at the server page level. */
export type EditorNameMap = Record<string, string>;

function resolveEditorName(
  wallet: string | undefined,
  editorNames?: EditorNameMap,
): string {
  if (!wallet) return 'Editor';
  return editorNames?.[wallet.toLowerCase()] ?? truncate(wallet);
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntil(deadline: string | null | undefined): number {
  if (!deadline) return 0;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / MS_PER_DAY);
}

export function extractAuthors(
  contracts?: Array<{
    contributors?: Array<{ contributorName?: string | null }>;
  }>,
): string[] {
  const authors: string[] = [];
  contracts?.forEach((contract) => {
    contract.contributors?.forEach((c) => {
      if (c.contributorName) authors.push(c.contributorName);
    });
  });
  return authors;
}

export function buildPdfUrl(
  paperId: string,
  versions?: Array<{ fileStorageKey?: string | null }>,
): string | undefined {
  const latest = (versions ?? []).at(-1);
  return latest?.fileStorageKey
    ? `/api/papers/${paperId}/content?format=raw`
    : undefined;
}

function reviewStatus(
  assignmentStatus: string,
  daysLeft: number,
  deadline: string | null | undefined,
): ReviewerDisplayStatus {
  if (assignmentStatus === 'submitted') return 'Submitted';
  if (!deadline) return 'Pending';
  if (daysLeft < 0) return 'Late';
  if (daysLeft <= 3) return 'In Progress';
  return 'Pending';
}

/** Maps DB row to dashboard list item. Computes daysLeft and display status. */
export function mapDbToAssignedReview(
  a: DbAssignedReview,
  index: number,
): AssignedReview {
  const daysLeft = daysUntil(a.deadline);
  return {
    id: index + 1,
    assignmentId: a.id,
    submissionId: a.submissionId,
    title: a.submission.paper.title,
    journal: a.submission.journal?.name ?? '—',
    assigned: formatDate(a.assignedAt),
    deadline: a.deadline ? formatDate(a.deadline) : '—',
    status: reviewStatus(a.status, daysLeft, a.deadline),
    daysLeft,
  };
}

/** Maps DB row to completed review item. Truncates paper hash for display. */
export function mapDbToCompletedReview(
  a: DbCompletedReview,
  index: number,
): CompletedReview {
  const versions =
    (a.submission.paper as { versions?: { paperHash: string }[] }).versions ??
    [];
  const latest = versions.at(-1);
  const hash = latest ? truncate(latest.paperHash, 8) : '—';
  return {
    id: index + 1,
    title: a.submission.paper.title,
    journal: a.submission.journal?.name ?? '—',
    submitted: formatDate(a.submittedAt ?? a.assignedAt),
    hash,
  };
}

/** Converts 0–100 DB scores to 0–5 display scale. */
export function mapDbToReputationScores(
  row: DbReputationRow,
  recentDelta: number = 0,
): ReputationScores {
  return {
    overall: toFivePointScale(row.overallScore),
    change: recentDelta,
    timeliness: toFivePointScale(row.timelinessScore),
    editorAvg: toFivePointScale(row.editorRatingAvg),
    authorAvg: toFivePointScale(row.authorRatingAvg),
    postPub: toFivePointScale(row.publicationScore),
  };
}

export function mapDbToReputationBreakdown(
  row: DbReputationRow,
): ReputationBreakdownItem[] {
  return [
    {
      label: 'Timeliness',
      value: toFivePointScale(row.timelinessScore),
      desc: 'Avg days to deadline',
    },
    {
      label: 'Editor Ratings',
      value: toFivePointScale(row.editorRatingAvg),
      desc: 'From journal editors',
    },
    {
      label: 'Author Feedback',
      value: toFivePointScale(row.authorRatingAvg),
      desc: 'Anonymous aggregate',
    },
    {
      label: 'Post-Publication',
      value: toFivePointScale(row.publicationScore),
      desc: 'Publication outcome',
    },
  ];
}

/** Extended mapping that includes review content, author response, and rebuttal info. */
export function mapDbToCompletedReviewExtended(
  a: DbCompletedReviewExtended,
  index: number,
  editorNames?: EditorNameMap,
): CompletedReviewExtended {
  const base = mapDbToCompletedReview(a, index);
  const { paper } = a.submission;
  const authors = extractAuthors(paper.contracts);
  const pdfUrl = buildPdfUrl(paper.id, paper.versions);
  const editorName = resolveEditorName(
    a.submission.journal?.editorWallet,
    editorNames,
  );
  const hasLitData = Boolean(paper.litAccessConditionsJson);

  // Find this reviewer's review from the assignment's reviews
  const myReview = a.reviews?.find(
    (r) => r.reviewerWallet === a.reviewerWallet,
  );
  const reviewContent = myReview
    ? {
        strengths: myReview.strengths ?? undefined,
        weaknesses: myReview.weaknesses ?? undefined,
        questionsForAuthors: myReview.questionsForAuthors ?? undefined,
        recommendation: myReview.recommendation ?? undefined,
      }
    : undefined;

  // Author response status
  const authorResponseStatus = a.submission.authorResponseStatus ?? undefined;

  // Rebuttal info
  const rebuttalRow = a.submission.rebuttals?.[0];
  const rebuttal = rebuttalRow
    ? {
        status: rebuttalRow.status,
        resolution: rebuttalRow.resolution ?? undefined,
        editorNotes: rebuttalRow.editorNotes ?? undefined,
        responseForThisReview: myReview
          ? (() => {
              const resp = rebuttalRow.responses?.find(
                (r) => r.reviewId === myReview.id,
              );
              return resp
                ? { position: resp.position, justification: resp.justification }
                : undefined;
            })()
          : undefined,
      }
    : undefined;

  return {
    ...base,
    assignmentId: a.id,
    submissionId: a.submissionId,
    abstract: paper.abstract ?? undefined,
    authors: authors.length > 0 ? authors : undefined,
    paperId: paper.id,
    pdfUrl,
    hasLitData,
    editorName,
    reviewContent,
    authorResponseStatus,
    rebuttal,
  };
}

/** Convert reviewer display items to shared PaperListItemData for the shared PaperList. */
export function toReviewerPaperListItems(
  papers: Array<{
    id: number;
    title: string;
    authors?: string[];
    abstract?: string;
  }>,
): PaperListItemData[] {
  return papers.map((p) => ({
    id: String(p.id),
    title: p.title,
    authors: p.authors?.join(', '),
    abstractSnippet: p.abstract,
  }));
}

export function mapDbToAssignedReviewExtended(
  a: DbAssignedReview,
  index: number,
  editorNames?: EditorNameMap,
): AssignedReviewExtended {
  const baseReview = mapDbToAssignedReview(a, index);
  const { paper } = a.submission;
  const authors = extractAuthors(paper.contracts);
  const pdfUrl = buildPdfUrl(paper.id, paper.versions);
  const editorName = resolveEditorName(
    a.submission.journal?.editorWallet,
    editorNames,
  );
  const hasLitData = Boolean(paper.litAccessConditionsJson);

  return {
    ...baseReview,
    abstract: paper.abstract,
    authors: authors.length > 0 ? authors : undefined,
    paperId: paper.id,
    pdfUrl,
    hasLitData,
    editorName,
  };
}

// ---------------------------------------------------------------------------
// Server-page helpers (moved from inline page logic)
// ---------------------------------------------------------------------------

/** Average days remaining across assignments that have a deadline. */
export function computeAvgDaysToDeadline(
  assignments: { deadline?: string | null }[],
): number {
  const withDeadlines = assignments.filter((a) => a.deadline);
  if (withDeadlines.length === 0) return 0;
  const totalDays = withDeadlines.reduce(
    (sum, a) => sum + Math.max(0, daysUntil(a.deadline)),
    0,
  );
  return Math.round((totalDays / withDeadlines.length) * 10) / 10;
}

/** Extract unique journal names from assigned + completed review rows. */
export function extractJournalNames(
  assigned: { submission: { journal?: { name?: string } | null } }[],
  completed: { submission: { journal?: { name?: string } | null } }[],
): string[] {
  const names = new Set<string>();
  for (const a of assigned) {
    if (a.submission.journal?.name) names.add(a.submission.journal.name);
  }
  for (const c of completed) {
    if (c.submission.journal?.name) names.add(c.submission.journal.name);
  }
  return Array.from(names);
}

/** Map reviewer ratings to ResearcherInsight items (only those with comments). */
export function mapRatingsToInsights(
  ratings: {
    reviewId: string;
    comment?: string | null;
    overallRating: number;
    createdAt: string;
  }[],
): ResearcherInsight[] {
  return ratings
    .filter(
      (r): r is typeof r & { comment: string } =>
        typeof r.comment === 'string' && r.comment.length > 0,
    )
    .map((r) => ({
      reviewId: r.reviewId,
      comment: r.comment,
      overallRating: r.overallRating,
      createdAt: r.createdAt,
    }));
}

/** Extract editor wallet addresses from review rows for buildEditorNameMap. */
export function extractEditorWallets(
  rows: { submission: { journal?: { editorWallet?: string } | null } }[],
): string[] {
  return rows
    .map((r) => r.submission.journal?.editorWallet)
    .filter((w): w is string => !!w);
}
