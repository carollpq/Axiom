import { AcceptedPapersClient } from "@/src/features/editor/components/accepted-papers.client";
import { mockIssues } from "@/src/features/editor/mock-data";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getJournalByEditorWallet, listJournalSubmissions } from "@/src/features/editor/queries";
import { mapDbToPaperCardData, mapDbToReviewerWithStatus } from "@/src/features/editor/mappers/journal";
import type { ReviewerWithStatus } from "@/src/shared/types/editor-dashboard";

export default async function AcceptedPapersPage() {
  const sessionWallet = await getSession();

  if (sessionWallet) {
    const journal = await getJournalByEditorWallet(sessionWallet);
    if (journal) {
      const allSubs = await listJournalSubmissions(journal.id);

      const acceptedSubs = allSubs.filter(
        s => s.status === "accepted" || s.status === "published",
      );

      const papers = acceptedSubs.map(mapDbToPaperCardData);

      const reviewStatuses: Record<string, ReviewerWithStatus[]> = {};
      for (const s of acceptedSubs) {
        if (s.reviewAssignments && s.reviewAssignments.length > 0) {
          reviewStatuses[s.id] = (s.reviewAssignments as { id: string; reviewerWallet: string; status: string }[]).map(mapDbToReviewerWithStatus);
        }
      }

      return (
        <AcceptedPapersClient
          papers={papers}
          reviewStatuses={reviewStatuses}
          issues={mockIssues}
        />
      );
    }
  }

  // Fallback would go here
  return (
    <AcceptedPapersClient
      papers={[]}
      reviewStatuses={{}}
      issues={mockIssues}
    />
  );
}
