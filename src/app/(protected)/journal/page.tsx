import { listJournalSubmissions, listReviewerPool } from "@/src/features/journal/queries";
import { mapDbToJournalSubmission, mapDbToPoolReviewer } from "@/src/features/journal/mappers/journal";
import { JournalDashboardClient } from "@/src/features/journal/components/journal-dashboard.client";

export default async function JournalDashboard() {
  const [rawSubmissions, rawReviewers] = await Promise.all([
    listJournalSubmissions(),
    listReviewerPool(),
  ]);

  const submissions = rawSubmissions.map(mapDbToJournalSubmission);
  const reviewerPool = rawReviewers.map(mapDbToPoolReviewer);

  return <JournalDashboardClient initialSubmissions={submissions} initialReviewerPool={reviewerPool} />;
}
