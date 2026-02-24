import { listUserPapers } from "@/src/features/papers/queries";
import { mapDbPaperToFrontend, computeStats } from "@/src/features/author/mappers/dashboard";
import { StatCard } from "@/src/shared/components";
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
