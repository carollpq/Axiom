import type { JournalSubmission, SubmissionStage, PoolReviewer } from "@/src/shared/types/journal-dashboard";
import type { DbJournalSubmission, DbReviewer } from "../queries";

function deriveStage(
  status: string,
  criteriaHash: string | null,
  reviewerWallets: string[],
  criteriaMet: boolean | null,
  decision: string | null,
): SubmissionStage {
  if (status === "published") return "Published";
  if (status === "rejected") return "Rejected";
  if (status === "under_review") {
    if (criteriaMet !== null || decision !== null) return "Decision Pending";
    return "Under Review";
  }
  // "submitted" / "revision_requested"
  if (reviewerWallets.length > 0) return "Reviewers Assigned";
  if (criteriaHash) return "Criteria Published";
  return "New";
}

export function mapDbToJournalSubmission(s: DbJournalSubmission, index: number): JournalSubmission {
  const latestVersion = s.paper.versions?.at(-1);
  const hash = latestVersion ? latestVersion.paperHash.slice(0, 8) + "..." : "—";
  const wallets = (s.reviewerWallets as string[] | null) ?? [];

  return {
    id: index + 1,
    title: s.paper.title,
    authors: s.paper.owner?.displayName ?? "Unknown",
    submitted: s.submittedAt.slice(0, 10),
    stage: deriveStage(s.status, s.criteriaHash ?? null, wallets, s.criteriaMet ?? null, s.decision ?? null),
    reviewers: wallets,
    deadline: s.reviewDeadline ?? null,
    criteriaPublished: !!s.criteriaHash,
    criteriaMet: s.criteriaMet ?? null,
    hash,
  };
}

export function mapDbToPoolReviewer(u: DbReviewer): PoolReviewer {
  const fields = (u.researchFields as string[] | null) ?? [];
  return {
    id: String(u.id),
    name: String(u.displayName ?? u.walletAddress),
    field: fields[0] ?? "—",
    score: 0,   // requires reputationEvents table
    orcid: String(u.orcidId ?? "—"),
    reviews: 0, // requires reviews table
  };
}
