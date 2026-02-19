import type { ReviewerTab, ReviewerTabConfig } from "@/types/reviewer-dashboard";

interface TabBarProps {
  tabs: ReviewerTabConfig[];
  activeTab: ReviewerTab;
  onTabChange: (tab: ReviewerTab) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex border-b border-[rgba(120,110,95,0.2)] mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          className="flex items-center gap-2 px-5 py-2.5 font-serif text-[13px] cursor-pointer transition-all duration-300 bg-transparent border-none"
          style={{
            borderBottom: activeTab === t.key ? "2px solid #c9b89e" : "2px solid transparent",
            color: activeTab === t.key ? "#c9b89e" : "#6a6050",
          }}
        >
          {t.label}
          <span
            className="text-[10px] px-[7px] py-0.5 rounded-[10px] font-sans"
            style={{
              background: activeTab === t.key ? "rgba(180,160,120,0.2)" : "rgba(120,110,95,0.15)",
              color: activeTab === t.key ? "#c9b89e" : "#6a6050",
            }}
          >
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
}
