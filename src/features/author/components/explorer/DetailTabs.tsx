"use client";

import type { DetailTab } from "@/src/features/author/types/explorer";

const DETAIL_TABS = ["overview", "provenance", "versions", "reviews"] as const;

interface DetailTabsProps {
  activeTab: DetailTab;
  reviewCount: number;
  onTabChange: (tab: DetailTab) => void;
}

export function DetailTabs({ activeTab, reviewCount, onTabChange }: DetailTabsProps) {
  return (
    <div className="flex mb-6" style={{ borderBottom: "1px solid rgba(120,110,95,0.2)" }}>
      {DETAIL_TABS.map(t => (
        <button
          key={t}
          onClick={() => onTabChange(t)}
          className="bg-transparent border-none py-2.5 px-5 font-serif text-[13px] cursor-pointer capitalize tracking-[0.5px] transition-all duration-300"
          style={{
            borderBottom: activeTab === t ? "2px solid #c9b89e" : "2px solid transparent",
            color: activeTab === t ? "#c9b89e" : "#6a6050",
          }}
        >{t}{t === "reviews" && reviewCount > 0 ? ` (${reviewCount})` : ""}</button>
      ))}
    </div>
  );
}
