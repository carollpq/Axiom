import { DashboardOverview } from "@/src/features/editor/components/dashboard-overview.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getUserByWallet } from "@/src/features/users/queries";
import { getJournalByEditorWallet, listJournalSubmissions } from "@/src/features/editor/queries";
import { mockDashboardStats, mockEditorProfile } from "@/src/features/editor/mock-data";
import { mapDbToEditorProfile } from "@/src/features/editor/mappers/journal";
import { getInitials } from "@/src/shared/lib/format";
import type { StatCardProps } from "@/src/shared/types/shared";
import type { EditorProfile } from "@/src/features/editor/types";

function mockStatsArray(): StatCardProps[] {
  const s = mockDashboardStats;
  return [
    { label: "New Submissions", value: s.newSubmissions },
    { label: "Awaiting Reviewer Assignment", value: s.awaitingAssignment },
    { label: "Under Review", value: s.underReview },
    { label: "Accepted Papers", value: s.acceptedPapers },
    { label: "Rejected Papers", value: s.rejectedPapers, alert: true },
  ];
}

export default async function JournalDashboard() {
  const sessionWallet = await getSession();

  let stats: StatCardProps[];
  let editorProfile: EditorProfile;

  if (sessionWallet) {
    const [user, journal] = await Promise.all([
      getUserByWallet(sessionWallet),
      getJournalByEditorWallet(sessionWallet),
    ]);

    editorProfile = mapDbToEditorProfile(user, journal, getInitials);

    if (journal) {
      const subs = await listJournalSubmissions(journal.id);

      // Single-pass metric computation
      let newSubmissions = 0, awaitingAssignment = 0, underReview = 0, accepted = 0, rejected = 0;
      for (const s of subs) {
        const countAccepted = () =>
          (s.reviewAssignments ?? []).filter((a: { status: string }) => a.status === "accepted" || a.status === "submitted").length;

        switch (s.status) {
          case "submitted":
          case "viewed_by_editor":
            newSubmissions++;
            break;
          case "criteria_published":
          case "reviewers_assigned":
            if (s.status === "reviewers_assigned" && countAccepted() >= 2) underReview++;
            else awaitingAssignment++;
            break;
          case "under_review":
          case "reviews_completed":
          case "rebuttal_open":
            underReview++;
            break;
          case "accepted":
          case "published":
            accepted++;
            break;
          case "rejected":
            rejected++;
            break;
        }
      }

      stats = [
        { label: "New Submissions", value: newSubmissions },
        { label: "Awaiting Reviewer Assignment", value: awaitingAssignment },
        { label: "Under Review", value: underReview },
        { label: "Accepted Papers", value: accepted },
        { label: "Rejected Papers", value: rejected, alert: true },
      ];
    } else {
      stats = mockStatsArray();
    }
  } else {
    editorProfile = mockEditorProfile;
    stats = mockStatsArray();
  }

  return <DashboardOverview stats={stats} editorProfile={editorProfile} />;
}
