import type { JournalStatCardData } from "@/types/journal-dashboard";
import { StatCard } from "./StatCard";

interface StatsRowProps {
  stats: JournalStatCardData[];
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="flex gap-4 mb-7 flex-wrap">
      {stats.map((s) => (
        <StatCard
          key={s.label}
          label={s.label}
          value={s.value}
          sub={s.sub}
          alert={s.alert}
        />
      ))}
    </div>
  );
}
