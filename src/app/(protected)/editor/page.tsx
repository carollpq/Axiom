import { DashboardOverview } from "@/src/features/editor/components/dashboard-overview.client";
import { mockEditorProfile, mockDashboardStats } from "@/src/features/editor/mock-data";
import type { StatCardProps } from "@/src/shared/types/shared";

export default async function JournalDashboard() {
  const s = mockDashboardStats;

  const stats: StatCardProps[] = [
    { label: "New Submissions", value: s.newSubmissions },
    { label: "Awaiting Reviewer Assignment", value: s.awaitingAssignment },
    { label: "Under Review", value: s.underReview },
    { label: "Accepted Papers", value: s.acceptedPapers },
    { label: "Rejected Papers", value: s.rejectedPapers, alert: true },
    { label: "Reviews Pending", value: s.reviewsPending },
  ];

  return <DashboardOverview stats={stats} editor={mockEditorProfile} />;
}
