import type { PaperListItemData } from '@/src/shared/components/paper-list-item';
import type {
  AssignedReview,
  AssignedReviewExtended,
  CompletedReview,
  CompletedReviewExtended,
  ReviewerDisplayStatus,
  ReputationScores,
  ReputationBreakdownItem,
} from '@/src/features/reviewer/types';
import type {
  DbAssignedReview,
  DbCompletedReview,
  DbCompletedReviewExtended,
  DbReputationRow,
} from '../queries';
import { formatDate, truncate } from '@/src/shared/lib/format';
import { toFivePointScale } from '@/src/features/reviews/mappers';

/** Wallet address → display name lookup, built at the server page level. */
export type EditorNameMap = Record<string, string>;

function resolveEditorName(
  wallet: string | undefined,
  editorNames?: EditorNameMap,
): string {
  if (!wallet) return 'Editor';
  return editorNames?.[wallet.toLowerCase()] ?? truncate(wallet);
}

function daysUntil(deadline: string | null): number {
  if (!deadline) return 0;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
): ReviewerDisplayStatus {
  if (assignmentStatus === 'submitted') return 'Submitted';
  if (daysLeft < 0) return 'Late';
  if (daysLeft <= 3) return 'In Progress';
  return 'Pending';
}

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
    status: reviewStatus(a.status, daysLeft),
    daysLeft,
  };
}

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
    editorRating: 0,
    authorRating: 0,
    hash,
  };
}

export function mapDbToReputationScores(
  row: DbReputationRow,
): ReputationScores {
  return {
    overall: toFivePointScale(row.overallScore),
    change: 0, // no historical delta available yet
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
    pdfUrl,
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

  return {
    ...baseReview,
    abstract: paper.abstract,
    authors: authors.length > 0 ? authors : undefined,
    pdfUrl,
    editorName,
  };
}
