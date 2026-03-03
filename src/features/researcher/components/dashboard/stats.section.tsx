import { listUserPapers } from "@/src/features/papers/queries";
import { mapDbPaperToFrontend, computeStats } from "@/src/features/researcher/mappers/dashboard";
import { StatCard } from "@/src/shared/components";

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function StatsSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const papers = rawPapers.map(mapDbPaperToFrontend);
  const stats = computeStats(papers);

  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
