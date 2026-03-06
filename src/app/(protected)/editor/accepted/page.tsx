import { AcceptedPapersClient } from "@/src/features/editor/components/accepted-papers.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import {
  getJournalByEditorWallet,
  listJournalSubmissions,
  listReviewerPool,
  listJournalIssues,
} from "@/src/features/editor/queries";
import { mapDbToPaperCardData, mapDbToReviewerWithStatus, buildNameByWallet, mapDbToJournalIssue } from "@/src/features/editor/mappers/journal";
import type { ReviewerWithStatus } from "@/src/features/editor/types";

export default async function AcceptedPapersPage() {
  const sessionWallet = await getSession();
  const journal = sessionWallet
    ? await getJournalByEditorWallet(sessionWallet)
    : null;

  if (!journal) {
    return (
      <AcceptedPapersClient
        papers={[]}
        reviewStatuses={{}}
        issues={[]}
        journalId=""
      />
    );
  }

  const [allSubs, reviewers, dbIssues] = await Promise.all([
    listJournalSubmissions(journal.id),
    listReviewerPool(),
    listJournalIssues(journal.id),
  ]);

  const nameByWallet = buildNameByWallet(reviewers);
  const issues = dbIssues.map(mapDbToJournalIssue);

  const acceptedSubs = allSubs.filter(
    s => s.status === "accepted" || s.status === "published",
  );

  const papers = acceptedSubs.map(mapDbToPaperCardData);

  const reviewStatuses: Record<string, ReviewerWithStatus[]> = {};
  for (const s of acceptedSubs) {
    if (!s.reviewAssignments?.length) continue;

    const reviewByAssignment = Object.fromEntries(
      (s.reviews ?? []).map(rev => [rev.assignmentId, {
        strengths: rev.strengths,
        weaknesses: rev.weaknesses,
        recommendation: rev.recommendation,
      }]),
    );

    reviewStatuses[s.id] = (s.reviewAssignments as { id: string; reviewerWallet: string; status: string }[])
      .map(a => {
        const mapped = mapDbToReviewerWithStatus(a, nameByWallet);
        const content = reviewByAssignment[a.id];
        if (content) mapped.reviewContent = content;
        return mapped;
      });
  }

  return (
    <AcceptedPapersClient
      papers={papers}
      reviewStatuses={reviewStatuses}
      issues={issues}
      journalId={journal.id}
    />
  );
}
