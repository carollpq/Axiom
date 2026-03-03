import { AcceptedPapersClient } from "@/src/features/editor/components/accepted-papers.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import {
  getJournalByEditorWallet,
  listJournalSubmissions,
  listReviewerPool,
} from "@/src/features/editor/queries";
import { mapDbToPaperCardData, mapDbToReviewerWithStatus } from "@/src/features/editor/mappers/journal";
import type { ReviewerWithStatus } from "@/src/features/editor/types";

export default async function AcceptedPapersPage() {
  const sessionWallet = await getSession();

  if (sessionWallet) {
    const journal = await getJournalByEditorWallet(sessionWallet);
    if (journal) {
      const [allSubs, reviewers] = await Promise.all([
        listJournalSubmissions(journal.id),
        listReviewerPool(),
      ]);

      const nameByWallet: Record<string, string> = Object.fromEntries(
        reviewers.map(u => [u.walletAddress as string, (u.displayName ?? u.walletAddress) as string]),
      );

      const acceptedSubs = allSubs.filter(
        s => s.status === "accepted" || s.status === "published",
      );

      const papers = acceptedSubs.map(mapDbToPaperCardData);

      const reviewStatuses: Record<string, ReviewerWithStatus[]> = {};
      for (const s of acceptedSubs) {
        if (s.reviewAssignments && s.reviewAssignments.length > 0) {
          reviewStatuses[s.id] = (s.reviewAssignments as { id: string; reviewerWallet: string; status: string }[])
            .map(a => mapDbToReviewerWithStatus(a, nameByWallet));
        }
      }

      return (
        <AcceptedPapersClient
          papers={papers}
          reviewStatuses={reviewStatuses}
          issues={[]}
        />
      );
    }
  }

  return (
    <AcceptedPapersClient
      papers={[]}
      reviewStatuses={{}}
      issues={[]}
    />
  );
}
