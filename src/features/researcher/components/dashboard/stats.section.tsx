import { listUserPapers } from '@/src/features/papers/queries';
import {
  mapPapersToSubmissionCards,
  computeStats,
  statsToCards,
} from '@/src/features/researcher/lib/dashboard';
import { StatCard } from '@/src/shared/components';

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function StatsSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const submissionCards = mapPapersToSubmissionCards(rawPapers);
  const stats = computeStats(submissionCards);
  const cards = statsToCards(stats);

  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {cards.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
