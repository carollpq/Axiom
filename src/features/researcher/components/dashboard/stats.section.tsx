import { listUserPapers } from '@/src/features/papers/queries';
import {
  mapPapersToSubmissionCards,
  computeStats,
} from '@/src/features/researcher/lib/dashboard';
import { DashboardStatCard } from '@/src/shared/components/dashboard-stat-card';

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function StatsSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const submissionCards = mapPapersToSubmissionCards(rawPapers);
  const stats = computeStats(submissionCards);

  const cards = [
    { label: 'New Submissions', value: stats.newSubmissions },
    { label: 'Under Review', value: stats.underReview },
    { label: 'Reviews Pending', value: stats.reviewsPending },
    { label: 'Accepted Papers', value: stats.accepted },
    { label: 'Rejected Papers', value: stats.rejected, alert: true },
  ];

  return (
    <>
      <h3 className="text-lg font-bold mb-6" style={{ color: '#d4ccc0' }}>
        Submission Overview
      </h3>
      <div className="grid grid-cols-5 gap-4">
        {cards.map((s) => (
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
