import type {
  AssignedReview,
  AssignedReviewExtended,
  CompletedReview,
  ReviewerDisplayStatus,
  ReputationScores,
  ReputationBreakdownItem,
} from "@/src/features/reviewer/types";
import type { DbAssignedReview, DbCompletedReview, DbReputationRow } from "../queries";
import { formatIsoDate, truncateHash, toFivePointScale } from "@/src/shared/lib/format";

function daysUntil(deadline: string | null): number {
  if (!deadline) return 0;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function reviewStatus(assignmentStatus: string, daysLeft: number): ReviewerDisplayStatus {
  if (assignmentStatus === "submitted") return "Submitted";
  if (daysLeft < 0) return "Late";
  if (daysLeft <= 3) return "In Progress";
  return "Pending";
}

export function mapDbToAssignedReview(a: DbAssignedReview, index: number): AssignedReview {
  const daysLeft = daysUntil(a.deadline);
  return {
    id: index + 1,
    assignmentId: a.id,
    submissionId: a.submissionId,
    title: a.submission.paper.title,
    journal: a.submission.journal?.name ?? "—",
    assigned: formatIsoDate(a.assignedAt),
    deadline: a.deadline ? formatIsoDate(a.deadline) : "—",
    status: reviewStatus(a.status, daysLeft),
    daysLeft,
  };
}

export function mapDbToCompletedReview(a: DbCompletedReview, index: number): CompletedReview {
  const versions = (a.submission.paper as { versions?: { paperHash: string }[] }).versions ?? [];
  const latest = versions.at(-1);
  const hash = latest ? truncateHash(latest.paperHash, 8) : "—";
  return {
    id: index + 1,
    title: a.submission.paper.title,
    journal: a.submission.journal?.name ?? "—",
    submitted: formatIsoDate(a.submittedAt ?? a.assignedAt),
    editorRating: 0,
    authorRating: 0,
    hash,
  };
}

export function mapDbToReputationScores(row: DbReputationRow): ReputationScores {
  return {
    overall: toFivePointScale(row.overallScore),
    change: 0, // no historical delta available yet
    timeliness: toFivePointScale(row.timelinessScore),
    editorAvg: toFivePointScale(row.editorRatingAvg),
    authorAvg: toFivePointScale(row.authorRatingAvg),
    postPub: toFivePointScale(row.publicationScore),
  };
}

export function mapDbToReputationBreakdown(row: DbReputationRow): ReputationBreakdownItem[] {
  return [
    { label: "Timeliness",       value: toFivePointScale(row.timelinessScore),  desc: "Avg days to deadline" },
    { label: "Editor Ratings",   value: toFivePointScale(row.editorRatingAvg),  desc: "From journal editors" },
    { label: "Author Feedback",  value: toFivePointScale(row.authorRatingAvg),  desc: "Anonymous aggregate" },
    { label: "Post-Publication", value: toFivePointScale(row.publicationScore), desc: "Publication outcome" },
  ];
}

export function mapDbToAssignedReviewExtended(a: DbAssignedReview, index: number): AssignedReviewExtended {
  const daysLeft = daysUntil(a.deadline);
  const baseReview = mapDbToAssignedReview(a, index);

  // Extract authors from authorship contracts
  const authors: string[] = [];
  if (a.submission.paper.contracts && Array.isArray(a.submission.paper.contracts)) {
    a.submission.paper.contracts.forEach((contract) => {
      if (contract.contributors && Array.isArray(contract.contributors)) {
        contract.contributors.forEach((contributor) => {
          if (contributor.contributorName) {
            authors.push(contributor.contributorName);
          }
        });
      }
    });
  }

  // Get PDF URL from the latest version
  const versions = (a.submission.paper as { versions?: Array<{ fileStorageKey?: string }> }).versions ?? [];
  const latestVersion = versions.at(-1);
  const pdfUrl = latestVersion?.fileStorageKey ? `/api/papers/${a.submission.paper.id}/content/${latestVersion.fileStorageKey}` : undefined;

  // Get editor name from journal
  const editorName = a.submission.journal?.editorWallet ?? "Editor";

  return {
    ...baseReview,
    abstract: a.submission.paper.abstract,
    authors: authors.length > 0 ? authors : undefined,
    pdfUrl,
    editorName,
  };
}

