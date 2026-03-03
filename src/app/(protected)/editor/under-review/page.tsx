import { UnderReviewClient } from "@/src/features/editor/components/under-review.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import {
  getJournalByEditorWallet,
  listJournalSubmissions,
  listReviewerPool,
  listReputationScores,
} from "@/src/features/editor/queries";
import { mapDbToPaperCardData, mapDbToPoolReviewer, mapDbToReviewerWithStatus } from "@/src/features/editor/mappers/journal";
import type { ReviewerWithStatus } from "@/src/features/editor/types";

export default async function UnderReviewPage() {
  const sessionWallet = await getSession();

  if (sessionWallet) {
    const journal = await getJournalByEditorWallet(sessionWallet);
    if (journal) {
      const [allSubs, reviewers, scores] = await Promise.all([
        listJournalSubmissions(journal.id),
        listReviewerPool(),
        listReputationScores(),
      ]);

      const scoreByWallet = Object.fromEntries(scores.map(s => [s.userWallet, s]));
      const nameByWallet: Record<string, string> = Object.fromEntries(
        reviewers.map(u => [u.walletAddress as string, (u.displayName ?? u.walletAddress) as string]),
      );

      const underReviewSubs = allSubs.filter(
        s => s.status === "reviewers_assigned" || s.status === "under_review",
      );

      const papers = underReviewSubs.map(mapDbToPaperCardData);
      const reviewerPool = reviewers.map(u => mapDbToPoolReviewer(u, scoreByWallet[u.walletAddress as string]));

      const reviewStatuses: Record<string, ReviewerWithStatus[]> = {};
      for (const s of underReviewSubs) {
        if (s.reviewAssignments && s.reviewAssignments.length > 0) {
          reviewStatuses[s.id] = (s.reviewAssignments as { id: string; reviewerWallet: string; status: string }[])
            .map(a => mapDbToReviewerWithStatus(a, nameByWallet));
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
      papers={[]}
      reviewerPool={[]}
      reviewStatuses={{}}
    />
  );
}
