import { AcceptedPapersClient } from "@/src/features/editor/components/accepted-papers.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import {
  getJournalByEditorWallet,
  listJournalSubmissions,
  listReviewerPool,
} from "@/src/features/editor/queries";
import { mapDbToPaperCardData, mapDbToReviewerWithStatus, buildNameByWallet } from "@/src/features/editor/mappers/journal";
import { mockIssues } from "@/src/features/editor/mock-data";
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

      const nameByWallet = buildNameByWallet(reviewers);

      const acceptedSubs = allSubs.filter(
        s => s.status === "accepted" || s.status === "published",
      );

      const papers = acceptedSubs.map(mapDbToPaperCardData);

      // Build review statuses with comment content in a single pass
      const reviewStatuses: Record<string, ReviewerWithStatus[]> = {};
      for (const s of acceptedSubs) {
        const reviewByAssignment: Record<string, { strengths: string | null; weaknesses: string | null; recommendation: string | null }> = {};
        for (const rev of (s.reviews ?? [])) {
          reviewByAssignment[rev.assignmentId] = {
            strengths: rev.strengths,
            weaknesses: rev.weaknesses,
            recommendation: rev.recommendation,
          };
        }

        if (s.reviewAssignments && s.reviewAssignments.length > 0) {
          reviewStatuses[s.id] = (s.reviewAssignments as { id: string; reviewerWallet: string; status: string }[])
            .map(a => {
              const mapped = mapDbToReviewerWithStatus(a, nameByWallet);
              const content = reviewByAssignment[a.id];
              if (content) {
                mapped.reviewContent = content;
              }
              return mapped;
            });
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

  return (
    <AcceptedPapersClient
      papers={[]}
      reviewStatuses={{}}
      issues={mockIssues}
    />
  );
}
