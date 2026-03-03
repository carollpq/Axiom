import type {
  AssignedReview,
  CompletedReview,
  ReviewStatus,
  ReputationScores,
  ReputationBreakdownItem,
} from "@/src/shared/types/reviewer-dashboard";
import type { DbAssignedReview, DbCompletedReview, DbReputationRow } from "../queries";

function daysUntil(deadline: string | null): number {
  if (!deadline) return 0;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function reviewStatus(assignmentStatus: string, daysLeft: number): ReviewStatus {
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
    title: a.submission.paper.title,
    journal: a.submission.journal?.name ?? "—",
    assigned: a.assignedAt.slice(0, 10),
    deadline: a.deadline ? a.deadline.slice(0, 10) : "—",
    status: reviewStatus(a.status, daysLeft),
    daysLeft,
  };
}

export function mapDbToCompletedReview(a: DbCompletedReview, index: number): CompletedReview {
  const versions = (a.submission.paper as { versions?: { paperHash: string }[] }).versions ?? [];
  const latest = versions.at(-1);
  const hash = latest ? latest.paperHash.slice(0, 8) + "..." : "—";
  return {
    id: index + 1,
    title: a.submission.paper.title,
    journal: a.submission.journal?.name ?? "—",
    submitted: (a.submittedAt ?? a.assignedAt).slice(0, 10),
    editorRating: 0,
    authorRating: 0,
    hash,
  };
}

// DB stores scores 0–100; UI renders 0.0–5.0
function toFiveScale(n: number) {
  return Math.round((n / 10) * 10) / 10;
}

export function mapDbToReputationScores(row: DbReputationRow): ReputationScores {
  return {
    overall: toFiveScale(row.overallScore),
    change: 0, // no historical delta available yet
    timeliness: toFiveScale(row.timelinessScore),
    editorAvg: toFiveScale(row.editorRatingAvg),
    authorAvg: toFiveScale(row.authorRatingAvg),
    postPub: toFiveScale(row.publicationScore),
  };
}

export function mapDbToReputationBreakdown(row: DbReputationRow): ReputationBreakdownItem[] {
  return [
    { label: "Timeliness",       value: toFiveScale(row.timelinessScore),  desc: "Avg days to deadline" },
    { label: "Editor Ratings",   value: toFiveScale(row.editorRatingAvg),  desc: "From journal editors" },
    { label: "Author Feedback",  value: toFiveScale(row.authorRatingAvg),  desc: "Anonymous aggregate" },
    { label: "Post-Publication", value: toFiveScale(row.publicationScore), desc: "Publication outcome" },
  ];
}
