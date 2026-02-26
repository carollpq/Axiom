import { DashboardOverview } from "@/src/features/editor/components/dashboard-overview.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getJournalByEditorWallet, listJournalSubmissions } from "@/src/features/editor/queries";
import { mockDashboardStats } from "@/src/features/editor/mock-data";
import type { StatCardProps } from "@/src/shared/types/shared";

export default async function JournalDashboard() {
  const sessionWallet = await getSession();

  let stats: StatCardProps[];

  if (sessionWallet) {
    const journal = await getJournalByEditorWallet(sessionWallet);
    if (journal) {
      const subs = await listJournalSubmissions(journal.id);

      const newSubmissions = subs.filter(s => s.status === "submitted").length;
      const criteriaPublished = subs.filter(s => s.status === "criteria_published").length;
      const reviewersAssigned = subs.filter(s => s.status === "reviewers_assigned").length;
      const underReview = subs.filter(s => s.status === "under_review").length;
      const accepted = subs.filter(s => s.status === "accepted" || s.status === "published").length;
      const rejected = subs.filter(s => s.status === "rejected").length;
      const reviewsPending = (subs.flatMap(s => s.reviewAssignments ?? []) as { status: string }[])
        .filter(a => a.status === "assigned" || a.status === "accepted")
        .length;

      stats = [
        { label: "New Submissions", value: newSubmissions },
        { label: "Criteria Published", value: criteriaPublished },
        { label: "Reviewers Assigned", value: reviewersAssigned },
        { label: "Under Review", value: underReview },
        { label: "Accepted", value: accepted },
        { label: "Rejected", value: rejected, alert: true },
        { label: "Reviews Pending", value: reviewsPending },
      ];
    } else {
      // No journal yet — show mock data
      const s = mockDashboardStats;
      stats = [
        { label: "New Submissions", value: s.newSubmissions },
        { label: "Awaiting Assignment", value: s.awaitingAssignment },
        { label: "Under Review", value: s.underReview },
        { label: "Accepted", value: s.acceptedPapers },
        { label: "Rejected", value: s.rejectedPapers, alert: true },
        { label: "Reviews Pending", value: s.reviewsPending },
      ];
    }
  } else {
    const s = mockDashboardStats;
    stats = [
      { label: "New Submissions", value: s.newSubmissions },
      { label: "Awaiting Assignment", value: s.awaitingAssignment },
      { label: "Under Review", value: s.underReview },
      { label: "Accepted", value: s.acceptedPapers },
      { label: "Rejected", value: s.rejectedPapers, alert: true },
      { label: "Reviews Pending", value: s.reviewsPending },
    ];
  }

  return <DashboardOverview stats={stats} />;
}
