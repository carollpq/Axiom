import { listUserPapers } from "@/features/papers/queries";
import { mapDbPaperToFrontend, computeStats } from "@/features/author/mappers/dashboard";
import { StatCard } from "@/components/shared";
import type { ApiPaper } from "@/src/shared/types/api";

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function StatsSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const papers = (rawPapers as unknown as ApiPaper[]).map(mapDbPaperToFrontend);
  const stats = computeStats(papers);

  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
