import type {
  JournalSubmission,
  SubmissionStage,
  StageColorConfig,
  DetailTab,
  ReviewCriterion,
  PoolReviewer,
} from "@/src/shared/types/journal-dashboard";
import { DetailHeader } from "./DetailHeader";
import { DetailTabs } from "./DetailTabs";
import { InfoTab } from "./InfoTab";
import { CriteriaTab } from "./CriteriaTab";
import { ReviewersTab } from "./ReviewersTab";
import { DecisionTab } from "./DecisionTab";

interface DetailPanelProps {
  submission: JournalSubmission;
  stageColors: Record<SubmissionStage, StageColorConfig>;
  detailTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
  criteria: ReviewCriterion[];
  reviewerPool: PoolReviewer[];
  filteredReviewers: PoolReviewer[];
  searchReviewer: string;
  onSearchChange: (value: string) => void;
}

export function DetailPanel({
  submission,
  stageColors,
  detailTab,
  onTabChange,
  onClose,
  criteria,
  reviewerPool,
  filteredReviewers,
  searchReviewer,
  onSearchChange,
}: DetailPanelProps) {
  return (
    <div
      className="flex-1 rounded-lg p-0 overflow-y-auto sticky top-20"
      style={{
        background: "rgba(45,42,38,0.5)",
        border: "1px solid rgba(120,110,95,0.2)",
        maxHeight: "calc(100vh - 240px)",
      }}
    >
      <DetailHeader submission={submission} stageColors={stageColors} onClose={onClose} />
      <DetailTabs activeTab={detailTab} onTabChange={onTabChange} />

      <div className="px-6 py-5">
        {detailTab === "info" && <InfoTab submission={submission} />}
        {detailTab === "criteria" && (
          <CriteriaTab submission={submission} criteria={criteria} />
        )}
        {detailTab === "reviewers" && (
          <ReviewersTab
            submission={submission}
            reviewerPool={reviewerPool}
            filteredReviewers={filteredReviewers}
            searchReviewer={searchReviewer}
            onSearchChange={onSearchChange}
          />
        )}
        {detailTab === "decision" && <DecisionTab submission={submission} />}
      </div>
    </div>
  );
}
