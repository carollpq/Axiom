import { DashboardStatCard } from '@/src/shared/components/dashboard-stat-card';
import type { DbJournalSubmission } from '@/src/features/editor/queries';

interface Props {
  subs: DbJournalSubmission[];
}

interface Stat {
  label: string;
  value: number;
  alert?: boolean;
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
        (a: { status: string }) =>
          a.status === 'accepted' || a.status === 'submitted',
      ).length;

    switch (s.status) {
      case 'submitted':
      case 'viewed_by_editor':
        newSubmissions++;
        break;
      case 'criteria_published':
      case 'reviewers_assigned':
        if (s.status === 'reviewers_assigned' && countAccepted() >= 2)
          underReview++;
        else awaitingAssignment++;
        break;
      case 'under_review':
      case 'reviews_completed':
      case 'rebuttal_open':
        underReview++;
        break;
      case 'accepted':
      case 'published':
        accepted++;
        break;
      case 'rejected':
        rejected++;
        break;
    }
  }

  const stats: Stat[] = [
    { label: 'New Submissions', value: newSubmissions },
    { label: 'Awaiting Assignment', value: awaitingAssignment },
    { label: 'Under Review', value: underReview },
    { label: 'Accepted Papers', value: accepted },
    { label: 'Rejected Papers', value: rejected, alert: true },
  ];

  return (
    <>
      <h3 className="text-lg font-bold mb-6" style={{ color: '#d4ccc0' }}>
        Submission Overview
      </h3>
      <div className="grid grid-cols-5 gap-4">
        {stats.map((s) => (
          <DashboardStatCard
            key={s.label}
            value={s.value}
            label={s.label}
            alert={s.alert}
          />
        ))}
      </div>
    </>
  );
}
