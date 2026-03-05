import type { ReviewerTab, ReviewerTabConfig } from "@/src/features/reviewer/types";

interface DashboardTabBarProps {
  tabs: ReviewerTabConfig[];
  activeTab: ReviewerTab;
  onTabChange: (tab: ReviewerTab) => void;
}

export function DashboardTabBar({ tabs, activeTab, onTabChange }: DashboardTabBarProps) {
  const tabLabels: Record<ReviewerTab, string> = {
    dashboard: "Dashboard",
    invites: "Incoming Invites",
    assigned: "Papers Under Review",
    completed: "Completed Papers",
  };

  return (
    <div className="flex gap-8 border-b" style={{ borderColor: "rgba(120,110,95,0.3)" }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key as ReviewerTab)}
          className="pb-4 font-medium transition-colors relative"
          style={{
            color: activeTab === tab.key ? "#c9a44a" : "#8a8070",
          }}
        >
          {tabLabels[tab.key as ReviewerTab] || tab.label}
          {activeTab === tab.key && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: "#c9a44a" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
