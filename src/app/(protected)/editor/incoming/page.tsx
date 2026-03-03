import { IncomingPapersClient } from "@/src/features/editor/components/incoming-papers.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import {
  getJournalByEditorWallet,
  listJournalSubmissions,
  listReviewerPool,
  listReputationScores,
} from "@/src/features/editor/queries";
import { mapDbToPaperCardData, mapDbToPoolReviewer } from "@/src/features/editor/mappers/journal";

export default async function IncomingPapersPage() {
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

      const incomingSubs = allSubs.filter(
        s => s.status === "submitted" || s.status === "criteria_published",
      );

      const reviewerPool = reviewers.map(u => mapDbToPoolReviewer(u, scoreByWallet[u.walletAddress as string]));

      const papersWithSubmissionId = incomingSubs.map(s => ({
        ...mapDbToPaperCardData(s),
        submissionId: s.id,
      }));

      return (
        <IncomingPapersClient
          papers={papersWithSubmissionId}
          reviewerPool={reviewerPool}
        />
      );
    }
  }

  return <IncomingPapersClient papers={[]} reviewerPool={[]} />;
}
