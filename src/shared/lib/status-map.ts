import type { PaperStatus } from "@/src/features/researcher/types/dashboard";

/** Maps DB paper_status enum → frontend display string (author dashboard context) */
const statusMap: Record<string, PaperStatus> = {
  draft: "Draft",
  registered: "Draft",
  contract_pending: "Contract Pending",
  submitted: "Submitted",
  viewed_by_editor: "Viewed by Editor",
  under_review: "Under Review",
  reviews_completed: "Reviews Complete",
  revision_requested: "Revision Requested",
  published: "Published",
  retracted: "Draft", // author dashboard doesn't surface retracted as a distinct tab
};

export function toDisplayStatus(dbStatus: string): PaperStatus {
  return statusMap[dbStatus] ?? "Draft";
}

/**
 * Maps DB paper_status enum → display string for public-facing contexts
 * (explorer, verify page) where "Retracted" must be shown explicitly.
 */
export function toPublicDisplayStatus(dbStatus: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    registered: "Draft",
    contract_pending: "Contract Pending",
    submitted: "Submitted",
    viewed_by_editor: "Viewed by Editor",
    under_review: "Under Review",
    reviews_completed: "Reviews Complete",
    revision_requested: "Revision Requested",
    published: "Published",
    retracted: "Retracted",
  };
  return map[dbStatus] ?? "Draft";
}

/** Maps frontend display string → DB enum for filtering */
const reverseMap: Record<PaperStatus, string[]> = {
  Draft: ["draft", "registered"],
  "Contract Pending": ["contract_pending"],
  Submitted: ["submitted"],
  "Viewed by Editor": ["viewed_by_editor"],
  "Under Review": ["under_review"],
  "Reviews Complete": ["reviews_completed"],
  "Revision Requested": ["revision_requested"],
  Published: ["published"],
};

export function toDbStatuses(displayStatus: PaperStatus): string[] {
  return reverseMap[displayStatus] ?? [displayStatus.toLowerCase()];
}
