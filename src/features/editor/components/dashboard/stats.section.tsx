import { DashboardStatCard } from '@/src/shared/components/dashboard-stat-card';
import type { DbJournalSubmission } from '@/src/features/editor/queries';
import { computeSubmissionStats } from '@/src/features/editor/lib/journal';

interface Props {
  subs: DbJournalSubmission[];
}

export function StatsSection({ subs }: Props) {
  const stats = computeSubmissionStats(subs);

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
