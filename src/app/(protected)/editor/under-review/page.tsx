import { UnderReviewClient } from "@/src/features/editor/components/under-review.client";
import {
  mockUnderReviewPapers,
  mockReviewerPool,
  mockReviewStatuses,
} from "@/src/features/editor/mock-data";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getJournalByEditorWallet, listJournalSubmissions, listReviewerPool } from "@/src/features/editor/queries";
import { mapDbToPaperCardData, mapDbToPoolReviewer, mapDbToReviewerWithStatus } from "@/src/features/editor/mappers/journal";
import type { ReviewerWithStatus } from "@/src/shared/types/editor-dashboard";

export default async function UnderReviewPage() {
  const sessionWallet = await getSession();

  if (sessionWallet) {
    const journal = await getJournalByEditorWallet(sessionWallet);
    if (journal) {
      const [allSubs, reviewers] = await Promise.all([
        listJournalSubmissions(journal.id),
        listReviewerPool(),
      ]);

      const underReviewSubs = allSubs.filter(
        s => s.status === "reviewers_assigned" || s.status === "under_review",
      );

      const papers = underReviewSubs.map(mapDbToPaperCardData);
      const reviewerPool = reviewers.map(mapDbToPoolReviewer);

      const reviewStatuses: Record<string, ReviewerWithStatus[]> = {};
      for (const s of underReviewSubs) {
        if (s.reviewAssignments && s.reviewAssignments.length > 0) {
          reviewStatuses[s.id] = (s.reviewAssignments as { id: string; reviewerWallet: string; status: string }[]).map(mapDbToReviewerWithStatus);
        }
      }

      return (
        <UnderReviewClient
          papers={papers}
          reviewerPool={reviewerPool}
          reviewStatuses={reviewStatuses}
        />
      );
    }
  }

  return (
    <UnderReviewClient
      papers={mockUnderReviewPapers}
      reviewerPool={mockReviewerPool}
      reviewStatuses={mockReviewStatuses}
    />
  );
}
