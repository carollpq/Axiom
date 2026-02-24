import type { AssignedReview, CompletedReview, ReviewStatus } from "@/src/shared/types/reviewer-dashboard";
import type { DbAssignedReview, DbCompletedReview } from "../queries";

function daysUntil(deadline: string | null): number {
  if (!deadline) return 0;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function reviewStatus(daysLeft: number): ReviewStatus {
  if (daysLeft < 0) return "Late";
  if (daysLeft <= 3) return "In Progress";
  return "Pending";
}

export function mapDbToAssignedReview(s: DbAssignedReview, index: number): AssignedReview {
  const daysLeft = daysUntil(s.reviewDeadline);
  return {
    id: index + 1,
    title: s.paper.title,
    journal: s.journal?.name ?? "—",
    assigned: s.submittedAt.slice(0, 10),
    deadline: s.reviewDeadline ?? "—",
    status: reviewStatus(daysLeft),
    daysLeft,
  };
}

export function mapDbToCompletedReview(s: DbCompletedReview, index: number): CompletedReview {
  const versions = (s.paper as { versions?: { paperHash: string }[] }).versions ?? [];
  const latest = versions.at(-1);
  const hash = latest ? latest.paperHash.slice(0, 8) + "..." : "—";
  return {
    id: index + 1,
    title: s.paper.title,
    journal: s.journal?.name ?? "—",
    submitted: (s.decidedAt ?? s.submittedAt).slice(0, 10),
    editorRating: 0, // requires reviews table
    authorRating: 0,  // requires reviews table
    hash,
  };
}
