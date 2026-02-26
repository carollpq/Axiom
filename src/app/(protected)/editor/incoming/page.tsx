import { IncomingPapersClient } from "@/src/features/editor/components/incoming-papers.client";
import { mockIncomingPapers, mockReviewerPool } from "@/src/features/editor/mock-data";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getJournalByEditorWallet, listJournalSubmissions, listReviewerPool } from "@/src/features/editor/queries";
import { mapDbToPaperCardData, mapDbToPoolReviewer } from "@/src/features/editor/mappers/journal";

export default async function IncomingPapersPage() {
  const sessionWallet = await getSession();

  if (sessionWallet) {
    const journal = await getJournalByEditorWallet(sessionWallet);
    if (journal) {
      const [allSubs, reviewers] = await Promise.all([
        listJournalSubmissions(journal.id),
        listReviewerPool(),
      ]);

      const incomingSubs = allSubs.filter(
        s => s.status === "submitted" || s.status === "criteria_published",
      );

      const papers = incomingSubs.map(mapDbToPaperCardData);
      const reviewerPool = reviewers.map(mapDbToPoolReviewer);

      // Pass submission IDs alongside papers so the client can call the assign-reviewer API
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

  // Fallback to mock data when no session or no journal found
  return (
    <IncomingPapersClient
      papers={mockIncomingPapers}
      reviewerPool={mockReviewerPool}
    />
  );
}
