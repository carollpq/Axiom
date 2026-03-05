import { StatCard } from "@/src/shared/components/StatCard";
import type { StatCardProps } from "@/src/shared/types/shared";
import type { DbJournalSubmission } from "@/src/features/editor/queries";

interface Props {
  subs: DbJournalSubmission[];
}

export function StatsSection({ subs }: Props) {
  let newSubmissions = 0,
    awaitingAssignment = 0,
    underReview = 0,
    accepted = 0,
    rejected = 0;

  for (const s of subs) {
    const countAccepted = () =>
      (s.reviewAssignments ?? []).filter(
        (a: { status: string }) => a.status === "accepted" || a.status === "submitted",
      ).length;

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

  const stats: StatCardProps[] = [
    { label: "New Submissions", value: newSubmissions },
    { label: "Awaiting Reviewer Assignment", value: awaitingAssignment },
    { label: "Under Review", value: underReview },
    { label: "Accepted Papers", value: accepted },
    { label: "Rejected Papers", value: rejected, alert: true },
  ];

  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
