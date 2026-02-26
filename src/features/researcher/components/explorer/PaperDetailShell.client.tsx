"use client";

import { useState } from "react";
import type { ExplorerPaper, DetailTab } from "@/src/features/researcher/types/explorer";
import { DetailTabs } from "./DetailTabs";
import { OverviewTab } from "./OverviewTab";
import { ProvenanceTab } from "./ProvenanceTab";
import { VersionsTab } from "./VersionsTab";
import { ReviewsTab } from "./ReviewsTab";

interface PaperDetailShellProps {
  paper: ExplorerPaper;
}

export function PaperDetailShell({ paper }: PaperDetailShellProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  return (
    <>
      <DetailTabs
        activeTab={activeTab}
        reviewCount={paper.reviews.length}
        onTabChange={setActiveTab}
      />
      {activeTab === "overview" && <OverviewTab paper={paper} paperId={paper.id} />}
      {activeTab === "provenance" && <ProvenanceTab paper={paper} />}
      {activeTab === "versions" && <VersionsTab versions={paper.versions} />}
      {activeTab === "reviews" && (
        <ReviewsTab
          reviews={paper.reviews}
          decision={paper.decision}
          status={paper.status}
        />
      )}
    </>
  );
}
