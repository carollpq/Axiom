import type { DetailTab } from "@/src/shared/types/journal-dashboard";

const detailTabs = ["info", "criteria", "reviewers", "decision"] as const;

interface DetailTabsProps {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}

export function DetailTabs({ activeTab, onTabChange }: DetailTabsProps) {
  return (
    <div className="flex" style={{ borderBottom: "1px solid rgba(120,110,95,0.1)" }}>
      {detailTabs.map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t)}
          className="bg-transparent border-none flex-1 py-2.5 px-2 text-[11px] cursor-pointer font-serif capitalize tracking-[0.5px]"
          style={{
            borderBottom: activeTab === t ? "2px solid #c9b89e" : "2px solid transparent",
            color: activeTab === t ? "#c9b89e" : "#6a6050",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
