import type { PaperStatus } from "@/types/dashboard";

/** Maps DB paper_status enum → frontend display string */
const statusMap: Record<string, PaperStatus> = {
  draft: "Draft",
  registered: "Draft",
  contract_pending: "Contract Pending",
  submitted: "Submitted",
  under_review: "Under Review",
  revision_requested: "Revision Requested",
  published: "Published",
  retracted: "Draft",
};

export function toDisplayStatus(dbStatus: string): PaperStatus {
  return statusMap[dbStatus] ?? "Draft";
}

/** Maps frontend display string → DB enum for filtering */
const reverseMap: Record<PaperStatus, string[]> = {
  Draft: ["draft", "registered"],
  "Contract Pending": ["contract_pending"],
  Submitted: ["submitted"],
  "Under Review": ["under_review"],
  "Revision Requested": ["revision_requested"],
  Published: ["published"],
};

export function toDbStatuses(displayStatus: PaperStatus): string[] {
  return reverseMap[displayStatus] ?? [displayStatus.toLowerCase()];
}
