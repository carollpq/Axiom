"use client";

import type { ExplorerPaper, DetailTab } from "@/types/explorer";
import { RetractionBanner } from "./RetractionBanner";
import { DetailHeader } from "./DetailHeader";
import { DetailTabs } from "./DetailTabs";
import { OverviewTab } from "./OverviewTab";
import { ProvenanceTab } from "./ProvenanceTab";
import { VersionsTab } from "./VersionsTab";
import { ReviewsTab } from "./ReviewsTab";

interface PaperDetailProps {
  paper: ExplorerPaper;
  detailTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onBack: () => void;
}

export function PaperDetail({ paper, detailTab, onTabChange, onBack }: PaperDetailProps) {
  return (
    <div className="max-w-[900px] mx-auto py-8 px-10">
      {/* Back button */}
      <button
        onClick={onBack}
        className="bg-transparent border-none text-[#6a6050] text-xs cursor-pointer font-serif p-0 mb-5 flex items-center gap-1.5"
      >{"\u2190"} Back to Explorer</button>

      <RetractionBanner paper={paper} />
      <DetailHeader paper={paper} />
      <DetailTabs activeTab={detailTab} reviewCount={paper.reviews.length} onTabChange={onTabChange} />

      {detailTab === "overview" && <OverviewTab paper={paper} />}
      {detailTab === "provenance" && <ProvenanceTab paper={paper} />}
      {detailTab === "versions" && <VersionsTab versions={paper.versions} />}
      {detailTab === "reviews" && <ReviewsTab reviews={paper.reviews} decision={paper.decision} status={paper.status} />}
    </div>
  );
}
