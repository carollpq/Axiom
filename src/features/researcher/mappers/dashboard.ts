import type {
  SubmissionCard,
  SubmissionDisplayStatus,
  DashboardStats,
  StatCardData,
} from "@/src/features/researcher/types/dashboard";
import type { DbPaperWithRelations } from "@/src/features/papers/queries";
import { formatIsoDate } from "@/src/shared/lib/format";
import { Send, Clock, FileCheck, CheckCircle, XCircle } from "lucide-react";

/**
 * Derives a user-friendly submission status from the DB submission status,
 * review counts, and author response.
 */
export function deriveSubmissionDisplayStatus(
  dbStatus: string,
  completedReviewCount: number,
  totalReviewCount: number,
  authorResponseStatus: string | null,
  hasReviews: boolean,
): SubmissionDisplayStatus {
  switch (dbStatus) {
    case "submitted":
      return "Paper Submitted";
    case "viewed_by_editor":
      return "Viewed By Editor";
    case "rejected":
      return hasReviews ? "Rejected" : "Desk Reject";
    case "criteria_published":
    case "reviewers_assigned":
      return "Assigned Reviewers";
    case "under_review":
      return "Reviews In Progress";
    case "reviews_completed":
      if (authorResponseStatus === "accepted") return "Reviews Sent to Editor";
      return "All Reviews Completed";
    case "rebuttal_open":
      return "Rebuttal Phase";
    case "accepted":
    case "published":
      return "Accepted";
    case "revision_requested":
      return "Reviews Sent to Editor";
    default:
      return "Paper Submitted";
  }
}

/**
 * Maps DB papers (with submissions) to SubmissionCard objects for the dashboard.
 * Only papers with at least one submission are included.
 */
export function mapPapersToSubmissionCards(
  papers: DbPaperWithRelations[],
): SubmissionCard[] {
  const cards: SubmissionCard[] = [];

  for (const p of papers) {
    if (!p.submissions || p.submissions.length === 0) continue;

    const authors =
      p.contracts
        ?.flatMap((c) => c.contributors ?? [])
        .map((c) => c.contributorName)
        .filter(Boolean)
        .join(", ") || "\u2014";

    for (const sub of p.submissions) {
      // These relations are included by the enriched listUserPapers query
      const subAny = sub as typeof sub & {
        journal?: { name: string };
        reviewAssignments?: { id: string; status: string }[];
      };
      const assignments = subAny.reviewAssignments ?? [];
      const totalReviewCount = assignments.length;
      const completedReviewCount = assignments.filter(
        (a) => a.status === "submitted",
      ).length;

      const status = deriveSubmissionDisplayStatus(
        sub.status,
        completedReviewCount,
        totalReviewCount,
        sub.authorResponseStatus,
        completedReviewCount > 0,
      );

      cards.push({
        id: sub.id,
        paperId: p.id,
        paperTitle: p.title,
        journalName: subAny.journal?.name ?? "\u2014",
        authors,
        submittedAt: formatIsoDate(sub.submittedAt),
        status,
        reviewerCount: totalReviewCount,
        completedReviewCount,
        totalReviewCount,
      });
    }
  }

  return cards;
}

/**
 * Computes the 5 dashboard stats from submission cards.
 */
export function computeStats(cards: SubmissionCard[]): DashboardStats {
  return {
    newSubmissions: cards.filter(
      (c) => c.status === "Paper Submitted" || c.status === "Viewed By Editor",
    ).length,
    underReview: cards.filter(
      (c) =>
        c.status === "Assigned Reviewers" || c.status === "Reviews In Progress",
    ).length,
    reviewsPending: cards.filter(
      (c) => c.status === "All Reviews Completed",
    ).length,
    accepted: cards.filter((c) => c.status === "Accepted").length,
    rejected: cards.filter(
      (c) => c.status === "Rejected" || c.status === "Desk Reject",
    ).length,
  };
}

/**
 * Converts DashboardStats to StatCardData array for rendering.
 */
export function statsToCards(stats: DashboardStats): StatCardData[] {
  return [
    { label: "New Submissions", value: String(stats.newSubmissions), icon: Send },
    { label: "Under Review", value: String(stats.underReview), icon: Clock },
    { label: "Reviews Pending", value: String(stats.reviewsPending), icon: FileCheck },
    { label: "Accepted Papers", value: String(stats.accepted), icon: CheckCircle },
    { label: "Rejected Papers", value: String(stats.rejected), icon: XCircle },
  ];
}
